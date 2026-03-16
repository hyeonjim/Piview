"""
routers/ocr.py
──────────────
POST /ocr/extract-text  ← 성분표 사진 → EasyOCR 추출 + Gemini 정제

파이프라인:
  이미지 업로드
    → OpenCV 인메모리 디코딩
    → EasyOCR 텍스트 + BBox 추출
    → 높이 기준 상위 7개 필터링
    → Gemini로 노이즈 제거 + 한글 공식명 변환
    → JSON 배열 반환
"""

import json
import os
import time
from pathlib import Path

import numpy as np
import cv2
import easyocr
from dotenv import load_dotenv
from fastapi import APIRouter, File, UploadFile, HTTPException
from google import genai
from google.genai import types

router = APIRouter()

# ── EasyOCR + Gemini 초기화 (서버 시작 시 한 번만) ──
print("⏳ EasyOCR 로딩 중...")
reader = easyocr.Reader(['ko', 'en'], gpu=False)
print("✅ EasyOCR 로딩 완료")

# ai/.env 파일을 먼저 읽어 로컬 개발과 서버 실행 방식을 통일합니다.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

# OCR은 Gemini를 쓰므로 서버 시작 시점에 키 유무를 바로 검증합니다.
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise RuntimeError("GEMINI_API_KEY is not set")

gemini_client = genai.Client(api_key=gemini_api_key)


# ── 엔드포인트 ────────────────────────────────────
@router.post("/extract-text")
async def extract_product_name(file: UploadFile = File(...)):
    """성분표 사진 업로드 → EasyOCR 추출 + Gemini 정제 → 한글 키워드 배열 반환"""
    start_time = time.perf_counter()
    try:
        # 1. 인메모리 이미지 디코딩
        contents = await file.read()
        nparr    = np.frombuffer(contents, np.uint8)
        img_cv   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img_cv is None:
            raise HTTPException(status_code=400, detail="이미지를 읽을 수 없어요.")

        # 2. EasyOCR 텍스트 추출 (좌표 포함)
        results   = reader.readtext(img_cv, detail=1)
        easyocr_done = time.perf_counter()
        print(f"⏱️ OCR EasyOCR 소요: {easyocr_done - start_time:.2f}초")
        raw_texts = []

        for (bbox, text, prob) in results:
            height = (bbox[2][1] - bbox[1][1] + bbox[3][1] - bbox[0][1]) / 2
            if prob > 0.3:
                raw_texts.append({"text": text, "height": round(float(height), 2)})

        # 3. 글자 높이 순 정렬 → 상위 7개
        # 패키지 전면의 제품명은 대체로 크게 찍히므로, 높이 순 정렬로 노이즈를 1차 제거합니다.
        raw_texts.sort(key=lambda x: x['height'], reverse=True)
        top_words = [item["text"] for item in raw_texts[:7]]
        print(f"👀 OCR 원본: {top_words}")

        # 4. Gemini로 노이즈 제거 + 한글 공식명 변환
        prompt = f"""
        너는 한국 화장품 DB 매칭 전문가야.
        다음은 화장품 패키지를 OCR로 읽은 텍스트 배열이야: {top_words}

        지시사항:
        1. 화장품명과 무관한 단어(용량, 숫자, ing, s, 기획 등 노이즈)는 버려라.
        2. 영어 브랜드명/제품명은 한국 시장 공식 한글 명칭으로 번역해라.
           (예: DR.G → 닥터지, Red blemish → 레드 블레미쉬)
        3. 띄어쓰기 오류나 오타를 교정해라.
        4. 정제된 단어들을 1차원 배열(List of strings) 형태로만 응답해라.

        올바른 응답 예시: ["닥터지", "레드 블레미쉬", "클리어 수딩 크림"]
        """

        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )
        gemini_done = time.perf_counter()
        print(f"⏱️ OCR Gemini 소요: {gemini_done - easyocr_done:.2f}초")

        # 5. 마크다운 찌꺼기 제거 후 파싱
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()

        cleaned_words = json.loads(response_text)
        print(f"✨ Gemini 정제 완료: {cleaned_words}")

        # 6. Spring Boot DTO 규격으로 반환
        final_candidates = [
            {"text": word, "height": 100.0 - i, "prob": 0.99}
            for i, word in enumerate(cleaned_words)
        ]

        return {
            "status":         "success",
            "filename":       file.filename,
            "top_candidates": final_candidates,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ OCR 서버 에러: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        total_time = time.perf_counter() - start_time
        print(f"⏱️ OCR 전체 소요: {total_time:.2f}초")

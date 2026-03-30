"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, SwitchCamera, ImagePlus } from "lucide-react";
import { useCaptureAnalysis, useAnalysisStatus } from "@/hooks";
import { useSurveyStore } from "@/stores";

export default function PhotoAnalysisPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // 카메라 스트림을 ref로 관리: state로 관리 시 렌더링이 트리거되어 성능 저하
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasCameraError, setHasCameraError] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(true);
  // preview: base64 data URL (촬영/업로드 후 미리보기)
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  // facingMode: "user"=전면, "environment"=후면
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  // flash: 촬영 시 흰색 플래시 애니메이션 트리거
  const [flash, setFlash] = useState(false);

  const { mutate: capture, isPending: isCapturing } = useCaptureAnalysis();
  // Zustand 선택자: (state) => state.xxx 형태로 명시적 작성
  const setAnalysisId = useSurveyStore((state) => state.setAnalysisId);
  const analysisId = useSurveyStore((state) => state.analysisId);
  const { data: analysisStatus } = useAnalysisStatus(analysisId);

  // 캡처 요청 중이거나 서버 분석 대기 중이면 true
  const isAnalyzing = isCapturing || analysisStatus?.status === "PENDING";

  // ── 카메라 시작 ──────────────────────────────────────────────
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    // 기존 스트림 정리 (동기): 이전 카메라 트랙을 반드시 중단해야 리소스 해제
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // setState는 await 이후에 호출: useEffect 내 동기 setState 경고 방지
    await Promise.resolve();
    setIsCameraLoading(true);

    try {
      let stream: MediaStream;
      try {
        // 4:3 비율(세로 기준 3:4) 해상도 요청
        // 전면(user): 960×1280 / 후면(environment): 1080×1440
        stream = await navigator.mediaDevices.getUserMedia({
          video:
            facing === "user"
              ? {
                  facingMode: { exact: "user" },
                  width: { ideal: 960 },
                  height: { ideal: 1280 },
                }
              : {
                  facingMode: { exact: "environment" },
                  width: { ideal: 1080 },
                  height: { ideal: 1440 },
                },
          audio: false,
        });
      } catch {
        // exact 실패(일부 기기) → facingMode 문자열로 폴백
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
      }

      streamRef.current = stream;

      // 전면 카메라: zoom 최솟값 강제 — 브라우저 기본 줌인 보정
      if (facing === "user") {
        const track = stream.getVideoTracks()[0];
        try {
          // getCapabilities는 표준 MediaTrackCapabilities에 없으므로 타입 확장
          const capabilities = track?.getCapabilities?.() as MediaTrackCapabilities & {
            zoom?: { min: number; max: number };
          };
          if (capabilities?.zoom) {
            await track.applyConstraints({
              advanced: [{ zoom: capabilities.zoom.min } as MediaTrackConstraintSet],
            });
          }
        } catch {
          /* zoom 미지원 기기 무시 */
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {}
      }
      setIsCameraActive(true);
      setHasCameraError(false);
      setIsCameraLoading(false);
    } catch {
      setHasCameraError(true);
      setIsCameraActive(false);
      setIsCameraLoading(false);
    }
  }, []);

  // videoRef 마운트 후 stream이 이미 있으면 연결 (타이밍 엇갈린 경우 보정)
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  });

  useEffect(() => {
    // 마운트 시 1회만 실행
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void startCamera(facingMode);
    return () => {
      // 언마운트 시 스트림 정리: 카메라 LED가 계속 켜지는 버그 방지
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []); // intentional mount-only

  // 권한 허용 후 탭으로 돌아올 때 카메라 재시도
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !isCameraActive && !preview) {
        startCamera(facingMode);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [isCameraActive, preview, facingMode]);

  const switchCamera = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  };

  // ── 사진 촬영 ────────────────────────────────────────────────
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    // 전면 카메라: 좌우 반전 — 거울 모드에서 자연스럽게 찍히도록
    if (facingMode === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    setPreview(canvas.toDataURL("image/jpeg", 0.9));
    // canvas → File 변환: API 업로드용
    canvas.toBlob(
      (blob) => {
        if (blob)
          setCapturedFile(
            new File([blob], "capture.jpg", { type: "image/jpeg" }),
          );
      },
      "image/jpeg",
      0.9,
    );
    // 촬영 완료 후 스트림 중단 (배터리 절약)
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraActive(false);
  };

  // ── 파일 업로드 ──────────────────────────────────────────────
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCapturedFile(file);
    const reader = new FileReader();
    // FileReader는 비동기: onload 콜백에서 결과 처리
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsCameraActive(false);
    };
    reader.readAsDataURL(file);
  };

  // ── 다시 촬영 ────────────────────────────────────────────────
  const retake = () => {
    setPreview(null);
    setCapturedFile(null);
    startCamera(facingMode);
  };

  const handleShutterClick = () => {
    if (isCameraLoading) return;
    if (isCameraActive) capturePhoto();
    else if (hasCameraError) fileRef.current?.click();
  };

  // ── 분석 완료/실패 감지 ──────────────────────────────────────
  useEffect(() => {
    if (analysisStatus?.status === "COMPLETED") {
      router.push("/skin-test/survey/1");
    }
    if (analysisStatus?.status === "FAILED") {
      // 분석 실패 → analysisId 초기화 후 재촬영 유도
      setAnalysisId("");
      alert(
        analysisStatus.errorMessage ?? "분석에 실패했어요. 다시 촬영해주세요.",
      );
    }
  }, [analysisStatus?.status]);

  // ── AI 분석 시작 ─────────────────────────────────────────────
  const handleAnalysisStart = () => {
    if (!capturedFile || isAnalyzing) return;
    capture(capturedFile, {
      onSuccess: ({ analysisId: id }) => {
        setAnalysisId(id);
      },
      onError: () => {
        // 분석 요청 실패 → 설문으로 이동 (수동 입력으로 대체)
        router.push("/skin-test/survey/1");
      },
    });
  };

  return (
    // z-1: 다른 레이어 위에 올라오도록 쌓임 맥락 생성
    <div className="absolute inset-0 bg-black overflow-hidden z-1">
      {/* 숨김 헬퍼: canvas(캡처용), input(파일 선택) */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── 카메라 / 프리뷰 영역 (전체화면) ── */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">

        {/* 4:3 뷰파인더 컨테이너 (세로 기준 width:height = 3:4) */}
        <div className="relative overflow-hidden w-full aspect-3/4">

          {/* 카메라 피드
           * scaleX(-1): 전면 카메라 미러링 (셀카 찍을 때 자연스러운 방향) */}
          {!preview && !hasCameraError && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
            />
          )}

          {/* 프리뷰 이미지 (base64 data URL → unoptimized 필수)
           * Next.js Image는 외부 URL만 최적화; data URL은 unoptimized 처리 */}
          {preview && (
            <Image
              src={preview}
              alt="Captured"
              fill
              unoptimized
              className="object-cover"
            />
          )}

          {/* 카메라 오류: 어두운 배경 플레이스홀더
           * camera-dark-bg: globals.css의 radial-gradient 클래스 */}
          {hasCameraError && !preview && (
            <div className="absolute inset-0 camera-dark-bg" />
          )}

          {/* 비네팅 효과: 가장자리 어둡게 → 피사체 집중
           * camera-vignette: globals.css의 radial-gradient 클래스 */}
          <div className="absolute inset-0 pointer-events-none z-3 camera-vignette" />

          {/* 플래시 효과: 촬영 시 흰색 순간 플래시
           * flashFade 애니메이션은 globals.css에 정의됨 */}
          {flash && (
            <div
              className="absolute inset-0 bg-white z-30 pointer-events-none"
              style={{ animation: "flashFade 0.15s ease forwards" }}
            />
          )}

          {/* 상단 그라디언트: 상단 바 가독성 확보
           * bg-linear-to-b: Tailwind v4 그라디언트 유틸리티 */}
          <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none z-6 bg-linear-to-b from-black/50 to-transparent" />

          {/* 하단 그라디언트: 하단 컨트롤 영역 가독성 확보 */}
          <div className="absolute bottom-0 left-0 right-0 h-44 pointer-events-none z-6 bg-linear-to-t from-black/65 to-transparent" />
        </div>

        {/* ── 상단 바 (전체화면 기준 오버레이) ── */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 pb-2 z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center border-none cursor-pointer w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm"
          >
            <ArrowLeft size={20} color="#fff" />
          </button>
          {/* camera-title-shadow: globals.css의 text-shadow 클래스 */}
          <span className="text-[22px] font-semibold text-white camera-title-shadow">
            AI 피부 분석
          </span>
        </div>

        {/* ── 가이드 텍스트 (촬영 전) ── */}
        {!preview && (
          <div className="absolute left-0 right-0 top-15 flex justify-center">
            {/* rounded-modal: globals.css의 --radius-modal(20px) / backdrop-blur-md: 12px */}
            <div className="px-5 py-2.5 rounded-modal bg-black/45 backdrop-blur-md">
              <p className="text-[18px] text-white font-semibold text-center m-0">
                {hasCameraError
                  ? "사진을 업로드하거나 촬영 버튼을 눌러주세요"
                  : "얼굴을 가이드 안에 맞춰주세요"}
              </p>
            </div>
          </div>
        )}

        {/* ── 촬영 완료 안내 (프리뷰 모드) ── */}
        {preview && (
          <div className="absolute top-18 left-0 right-0 flex justify-center z-10">
            {/* bg-black/50: HINT_BOX_DARK 대체 */}
            <div className="px-5 py-2.5 rounded-modal bg-black/50 backdrop-blur-md">
              <p className="text-[18px] text-white font-semibold text-center m-0">
                사진이 준비되었어요!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── 하단 컨트롤 바 ── */}
      {/* bg-black/75: 반투명 검정 / camera-bottom-safe: iOS safe-area 패딩 */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/75 camera-bottom-safe">
        {!preview ? (
          /* 촬영 모드 */
          <div className="flex flex-col items-center pt-5 pb-3 gap-4">
            <div className="flex items-center justify-center gap-12">
              {/* 갤러리 업로드 버튼
               * bg-white/12: 반투명 흰색 / backdrop-blur-sm: 8px 블러 */}
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center cursor-pointer border-none w-12 h-12 rounded-[14px] bg-white/12 backdrop-blur-sm"
              >
                <ImagePlus size={22} color="#fff" />
              </button>

              {/* 셔터 버튼
               * 외부: w-19 h-19(76px) 흰색 테두리 원
               * 내부: shutter-gradient (globals.css 핑크 그라디언트) */}
              <button
                onClick={handleShutterClick}
                className="cursor-pointer border-none transition-all active:scale-90 w-19 h-19 rounded-full bg-transparent border-4 border-white/80 p-1"
              >
                <div className="w-full h-full rounded-full flex items-center justify-center shutter-gradient" />
              </button>

              {/* 카메라 전환 버튼 (전면 ↔ 후면) */}
              <button
                onClick={switchCamera}
                className="flex items-center justify-center cursor-pointer border-none w-12 h-12 rounded-[14px] bg-white/12 backdrop-blur-sm"
              >
                <SwitchCamera size={22} color="#fff" />
              </button>
            </div>
          </div>
        ) : (
          /* 프리뷰 모드 */
          <div className="flex flex-col items-center pt-5 pb-3 gap-3 px-6">
            {/* AI 분석 시작 버튼
             * isAnalyzing 상태에 따라 활성/반투명 전환 */}
            <button
              onClick={handleAnalysisStart}
              disabled={isAnalyzing}
              className={[
                "w-full h-13 rounded-2xl text-white text-[15px] font-semibold transition-all active:scale-[0.97] cursor-pointer border-none",
                isAnalyzing
                  ? "bg-[rgba(162,170,123,0.5)] cursor-default"
                  : "bg-linear-to-br from-[#A2AA7B] to-[#8a9468] shadow-[0_4px_16px_rgba(162,170,123,0.4)]",
              ].join(" ")}
            >
              {isAnalyzing ? "🔍 분석 중..." : "🤖 AI 분석 시작하기"}
            </button>
            <div className="flex gap-3 w-full">
              {/* 다시 촬영 버튼
               * h-11: 44px / backdrop-blur-sm: 8px 블러 */}
              <button
                onClick={retake}
                className="flex-1 h-11 rounded-xl bg-white/15 backdrop-blur-sm text-white text-[13px] font-semibold border border-white/20 transition-all active:scale-[0.97] cursor-pointer"
              >
                다시 촬영
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

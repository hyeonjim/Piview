package com.piview.backend.domain.ocr.recognition.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OcrRecognitionResponseDto {
    private boolean isSuccess;       // 매칭 성공 여부
    private Long productId;          // 상품 PK
    private String brandName;        // 브랜드명
    private String productName;      // 상품명
    private int matchAccuracy;       // 매칭 점수
}
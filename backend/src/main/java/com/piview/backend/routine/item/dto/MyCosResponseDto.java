package com.piview.backend.routine.item.dto;

import com.piview.backend.product.entity.SkinTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@Builder
public record MyCosResponseDto (
    @Schema(description = "보유제품 고유 ID", example = "1")
    Long id,
    @Schema(description = "브랜드명", example = "닥터지")
    String brand,
    @Schema(description = "화장품 이름", example = "[TROUBLE HATER] 핑크 파우더 토너")
    String productName,
    @Schema(description = "카테고리", example = "스킨/토너")
    String category,
    @Schema(description = "제품 이미지 URL", example = "https://image.piview.com/...")
    String imageUrl,
    @Schema(description = "제품 1순위 피부 타입", example = "OILY (지성)")
    SkinTypeEnum topSkinType,
    @Schema(description = "제품 2순위 피부 타입", example = "COMBINATION (수부지)")
    SkinTypeEnum top2SkinType
){}
package com.piview.backend.user.disliked.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record DislikedProductSummaryResponse(
    // 안 맞는 제품 등록 ID
    @Schema(description = "안 맞는 제품 등록 ID입니다.", example = "1")
    Long dislikedProductId,

    // 실제 상품 ID
    @Schema(description = "상품 ID입니다.", example = "161485")
    Long productId,

    // 상품명
    @Schema(description = "상품명입니다.", example = "판테토인 에센스 토너")
    String productName,

    // 브랜드명
    @Schema(description = "브랜드명입니다.", example = "마녀공장")
    String brandName,

    // 카테고리명
    @Schema(description = "카테고리명입니다.", example = "스킨/토너")
    String categoryName,

    // 상품 이미지 경로 또는 파일명
    @Schema(description = "상품 이미지 URL 또는 파일명입니다.", example = "https://piview-products-images.s3.ap-northeast-2.amazonaws.com/products/glowpick_images/161485.jpg")
    String imageUrl,

    // 용량 정보
    @Schema(description = "상품 용량 정보입니다.", example = "200ml")
    String volume,

    // 가격 정보
    @Schema(description = "상품 가격 정보입니다.", example = "32000")
    Integer price,

    // 1순위 추천 피부타입 코드
    @Schema(description = "상품의 1순위 추천 피부타입 코드입니다.", example = "combination")
    String topSkinType,

    // 2순위 추천 피부타입 코드
    @Schema(description = "상품의 2순위 추천 피부타입 코드입니다.", example = "oily")
    String top2SkinType
) {
}

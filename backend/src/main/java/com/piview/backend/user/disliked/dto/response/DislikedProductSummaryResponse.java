package com.piview.backend.user.disliked.dto.response;

public record DislikedProductSummaryResponse(
    // 안 맞는 제품 등록 행의 PK
    Long dislikedProductId,

    // 실제 상품 PK
    Long productId,

    // 상품명
    String productName,

    // 브랜드명
    String brandName,

    // 카테고리명
    String categoryName,

    // 상품 이미지 URL
    String imageUrl,

    // 용량 정보
    String volume,

    // 가격 정보
    Integer price,

    // 1순위 추천 피부타입
    String topSkinType,

    // 2순위 추천 피부타입
    String top2SkinType
) {
}

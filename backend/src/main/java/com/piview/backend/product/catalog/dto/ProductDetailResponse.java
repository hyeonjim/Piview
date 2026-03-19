package com.piview.backend.product.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
@AllArgsConstructor
public class ProductDetailResponse {

    private Long productId;
    private String imageUrl;
    private String brandName;
    private String productName;
    private List<String> skinTypes;
    private List<String> tags;
    private Integer price;
    private String volume;

    private Integer lowCount;
    private Integer mediumCount;
    private Integer highCount;
    private Integer unknownCount;

    private List<String> cautionIngredients;    // high 등급 성분들
    private List<String> allergenIngredients;   // 알레르기 유발 성분들
    private List<ProductIngredientDetailResponse> ingredients;

    private Map<String, Integer> skinTypeScores;    // 스킨 타입 별 점수
    private boolean isLiked;
}

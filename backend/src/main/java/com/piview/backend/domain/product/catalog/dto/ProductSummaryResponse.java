package com.piview.backend.domain.product.catalog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.piview.backend.domain.product.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class ProductSummaryResponse {

    private Long productId;
    private String name;
    private String brandName;
    private Long categoryId;
    private String categoryName;
    private String imageUrl;
    private List<String> skinTypes;

    @JsonProperty("tags")
    private List<String> concerns;
    private boolean isLiked;

    public static ProductSummaryResponse from(Product product, boolean isLiked) {
        return from(product, isLiked, List.of());
    }

    public static ProductSummaryResponse from(Product product, boolean isLiked, List<String> concerns) {

        List<String> skinTypes = new ArrayList<>();

        if (product.getTopSkinType() != null) {
            skinTypes.add(product.getTopSkinType().name());
        }
        if (product.getTop2SkinType() != null) {
            skinTypes.add(product.getTop2SkinType().name());
        }

        return ProductSummaryResponse.builder()
                .productId(product.getProductId())
                .name(product.getName())
                .brandName(product.getBrand() != null ? product.getBrand().getBrandName() : null)
                .categoryId(product.getCategory() != null ? product.getCategory().getCategoryId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getCategoryName() : null)
                .imageUrl(product.getImage() != null ? product.getImage().getUrl() : null)
                .skinTypes(skinTypes)
                .concerns(concerns)     // 태그 파이프라인 미구현 -> null 고정(추후 추가 예정)
                .isLiked(isLiked)
                .build();

    }
}

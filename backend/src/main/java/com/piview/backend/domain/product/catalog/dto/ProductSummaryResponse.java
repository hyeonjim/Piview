package com.piview.backend.domain.product.catalog.dto;

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
    private String categoryName;
    private String imageUrl;
    private List<String> skinTypes;
    private List<String> tags;
    private boolean isLiked;

    public static ProductSummaryResponse from(Product product, boolean isLiked) {

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
                .categoryName(product.getCategory() != null ? product.getCategory().getCategoryName() : null)
                .imageUrl(product.getImage() != null ? product.getImage().getUrl() : null)
                .skinTypes(skinTypes)
                .tags(null)     // 태그 파이프라인 미구현 -> null 고정(추후 추가 예정)
                .isLiked(isLiked)
                .build();

    }
}

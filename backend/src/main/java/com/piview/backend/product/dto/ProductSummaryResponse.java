package com.piview.backend.product.dto;

import com.piview.backend.product.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

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
    private Integer price;
    private String topSkinType;
    private String top2SkinType;
    private List<String> tags;

    public static ProductSummaryResponse from(Product product) {

        String topSkinType = null;
        String top2SkinType = null;

        if (product.getSkinScore() != null) {
            if (product.getSkinScore().getTopSkinType() != null) {
                topSkinType = product.getSkinScore().getTopSkinType().name();
            }
            if (product.getSkinScore().getTop2SkinType() != null) {
                top2SkinType = product.getSkinScore().getTop2SkinType().name();
            }
        }

        return ProductSummaryResponse.builder()
                .productId(product.getProductId())
                .name(product.getName())
                .brandName(product.getBrand() != null ? product.getBrand().getBrandName() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getCategoryName() : null)
                .imageUrl(product.getImage() != null ? product.getImage().getUrl() : null)
                .price(product.getPrice())
                .topSkinType(topSkinType)
                .top2SkinType(top2SkinType)
                .tags(null)     // 태그 파이프라인 미구현 -> null 고정(추후 추가 예정)
                .build();
    }
}

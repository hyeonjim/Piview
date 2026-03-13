package com.piview.backend.product.catalog.dto;

import com.piview.backend.product.entity.Product;
import com.piview.backend.product.entity.SkinTypeEnum;
import lombok.Builder;

@Builder
public record ProductSearchResponseDto(
    Long productId,
    String brandName,
    String productName,
    String imageUrl,
    String categoryName,
    SkinTypeEnum top1SkinType,
    SkinTypeEnum top2SkinType
) {
  // Entity를 DTO로 변환하는 정적 팩토리 메서드
  public static ProductSearchResponseDto from(Product product) {
    return ProductSearchResponseDto.builder()
        .productId(product.getProductId())
        .brandName(product.getBrand() != null ? product.getBrand().getBrandName() : null)
        .productName(product.getName())
        .imageUrl(product.getImage() != null ? product.getImage().getUrl() : null)
        .categoryName(product.getCategory() != null ? product.getCategory().getCategoryName() : null)
        .top1SkinType(product.getSkinScore() != null ? product.getSkinScore().getTopSkinType() : null)
        .top2SkinType(product.getSkinScore() != null ? product.getSkinScore().getTop2SkinType() : null)
        .build();
  }
}
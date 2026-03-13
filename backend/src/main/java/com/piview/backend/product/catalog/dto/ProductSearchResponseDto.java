package com.piview.backend.product.catalog.dto;

import com.piview.backend.product.entity.Product;
import lombok.Builder;

@Builder
public record ProductSearchResponseDto(
    Long productId,
    String brandName,
    String productName,
    String imageUrl
) {
  // Entity를 DTO로 변환하는 정적 팩토리 메서드
  public static ProductSearchResponseDto from(Product product) {
    return ProductSearchResponseDto.builder()
        .productId(product.getProductId())
        .brandName(product.getBrand() != null ? product.getBrand().getBrandName() : null)
        .productName(product.getName())
        .imageUrl(product.getImage() != null ? product.getImage().getUrl() : null)
        .build();
  }
}
package com.piview.backend.domain.product.recommend.dto;

import com.piview.backend.domain.product.entity.Product;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
public class RecommendResponseDto {
  private Long productId;
  private String name;
  private String brandName;
  private String categoryName;
  private String imageUrl;

  private Integer price;
  private String volume;
  private String description;

  private List<String> skinTypes;
  private boolean isLiked;

  public static RecommendResponseDto from(Product product){

    List<String> combinedSkinTypes = new ArrayList<>();
    if (product.getTopSkinType()!=null){
      combinedSkinTypes.add(product.getTopSkinType().name());
    }
    if (product.getTop2SkinType() != null) {
      combinedSkinTypes.add(product.getTop2SkinType().name());
    }

    return RecommendResponseDto.builder()
        .productId(product.getProductId())
        .name(product.getName())
        .brandName(product.getBrand() != null? product.getBrand().getBrandName():null)
        .categoryName(product.getCategory() != null? product.getCategory().getCategoryName():null)
        .imageUrl(product.getImage() != null? product.getImage().getUrl():null)
        .price(product.getPrice())
        .volume(product.getVolume())
        .description(product.getDescription())
        .skinTypes(combinedSkinTypes)
        .isLiked(false)
        .build();

  }
}

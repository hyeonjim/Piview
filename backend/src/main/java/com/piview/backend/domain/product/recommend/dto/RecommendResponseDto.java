package com.piview.backend.domain.product.recommend.dto;

import com.piview.backend.domain.product.entity.Product;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

  private String concernName;

  public static RecommendResponseDto from(Product product, boolean isLiked, Long concernId){

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
        .isLiked(isLiked)
        .concernName(SKIN_CONCERN_MAP.getOrDefault(concernId, ""))
        .build();
  }

  private static final Map<Long, String> SKIN_CONCERN_MAP = Map.ofEntries(
      Map.entry(1L, "아토피"),
      Map.entry(2L, "여드름"),
      Map.entry(3L, "미백"),
      Map.entry(4L, "기미/주근깨/잡티"),
      Map.entry(5L, "주름/탄력"),
      Map.entry(6L, "노화방지-40대이상"),
      Map.entry(7L, "피지"),
      Map.entry(8L, "블랙헤드"),
      Map.entry(9L, "속건조"),
      Map.entry(10L, "각질"),
      Map.entry(11L, "진정")
  );
}

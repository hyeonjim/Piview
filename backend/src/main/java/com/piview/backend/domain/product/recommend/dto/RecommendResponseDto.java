package com.piview.backend.domain.product.recommend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.piview.backend.domain.product.entity.Product;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

  private List<String> skinTypes;
  private boolean isLiked;

  @JsonProperty("tags")
  private List<String> concerns;

  // 1. 유저가 선택한 1순위 고민 ID를 깔끔한 새 이름으로 변환할 맵
  private static final Map<Long, String> SKIN_CONCERN_MAP = Map.ofEntries(
          Map.entry(1L, "아토피"),
          Map.entry(2L, "여드름"),
          Map.entry(3L, "미백"),
          Map.entry(4L, "색소침착"),   // 기미/주근깨/잡티 -> 색소침착
          Map.entry(5L, "안티에이징"), // 주름/탄력 -> 안티에이징
          Map.entry(6L, "안티에이징"), // 노화방지-40대이상 -> 안티에이징
          Map.entry(7L, "피지"),
          Map.entry(8L, "블랙헤드"),
          Map.entry(9L, "수분"),       // 속건조 -> 수분
          Map.entry(10L, "각질"),
          Map.entry(11L, "진정")       // 진정 -> 진정
  );

  // 2. DB에서 꺼내온 투박한 태그 이름(String)을 깔끔한 새 이름으로 덮어씌울 맵
  private static final Map<String, String> TAG_RENAME_MAP = Map.ofEntries(
          Map.entry("아토피", "아토피"),
          Map.entry("여드름", "여드름"),
          Map.entry("미백", "미백"),
          Map.entry("기미/주근깨/잡티", "색소침착"), // 괄호 안의 긴 단어를 앞의 깔끔한 단어로!
          Map.entry("주름/탄력", "안티에이징"),
          Map.entry("노화방지-40대이상", "안티에이징"),
          Map.entry("피지", "피지"),
          Map.entry("블랙헤드", "블랙헤드"),
          Map.entry("속건조", "수분"),           // 속건조를 수분으로!
          Map.entry("각질", "각질"),
          Map.entry("진정", "진정")
  );

  public static RecommendResponseDto from(Product product, boolean isLiked, Long concernId, List<String> concerns) {

    List<String> combinedSkinTypes = new ArrayList<>();
    if (product.getTopSkinType() != null) {
      combinedSkinTypes.add(product.getTopSkinType().name());
    }
    if (product.getTop2SkinType() != null) {
      combinedSkinTypes.add(product.getTop2SkinType().name());
    }

    // ★ 핵심 로직: DB에서 가져온 투박한 태그들을 예쁜 태그로 변환하고 중복을 제거합니다.
    List<String> beautifulTags = concerns.stream()
            .map(oldName -> TAG_RENAME_MAP.getOrDefault(oldName, oldName)) // 예쁜 이름으로 교체!
            .distinct() // 중복 태그 제거! (예: 주름/탄력과 노화방지가 둘 다 있어도 '안티에이징' 딱 1개만 남김)
            .collect(Collectors.toList());

    return RecommendResponseDto.builder()
            .productId(product.getProductId())
            .name(product.getName())
            .brandName(product.getBrand() != null ? product.getBrand().getBrandName() : null)
            .categoryName(product.getCategory() != null ? product.getCategory().getCategoryName() : null)
            .imageUrl(product.getImage() != null ? product.getImage().getUrl() : null)
            .price(product.getPrice())
            .skinTypes(combinedSkinTypes)
            .isLiked(isLiked)
            .concerns(beautifulTags) // ★ 예쁘게 포장된 태그 리스트를 넣어줍니다.
            .build();
  }
}
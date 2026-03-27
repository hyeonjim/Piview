package com.piview.backend.domain.product.dynamic.service;

import com.piview.backend.domain.product.catalog.dto.ProductPageResponse;
import com.piview.backend.domain.product.catalog.dto.ProductSummaryResponse;
import com.piview.backend.domain.product.catalog.repository.ProductConcernCacheRepository;
import com.piview.backend.domain.product.catalog.repository.ProductRepository;
import com.piview.backend.domain.product.dynamic.repository.ProductSimilarityRepository;
import com.piview.backend.domain.product.dynamic.repository.RecommendationScoreRepository;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.product.like.repository.ProductLikeRepository;
import com.piview.backend.domain.user.login.entity.User;
import com.piview.backend.domain.user.login.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductRecommendationService {

  private final ProductRepository productRepository;
  private final ProductLikeRepository productLikeRepository;
  private final UserRepository userRepository;
  private final ProductConcernCacheRepository productConcernCacheRepository;
  private final RecommendationScoreRepository recommendationScoreRepository;
  private final ProductSimilarityRepository productSimilarityRepository;

  public ProductPageResponse getRecommendedProducts(Long userId, Integer bigCategoryId, Long categoryId, Pageable pageable) {

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
    
    // Null 안전한 처리: 피부타입이 없으면 null로 넘겨줌
    String userSkinType = (user.getMySkinType() != null) ? user.getMySkinType().name() : null;

    //유저의 Top 관심 상품 ID 3개 추출
    List<Long> topInteractedProductIds = recommendationScoreRepository.findTopProductIdsByUserId(userId);


    //2. 관심 상품과 유사한(같이 많이 본) 상품 ID들 추출
    List<Long> similarProductIds = new ArrayList<>();
    if (!topInteractedProductIds.isEmpty()) {
        similarProductIds = productSimilarityRepository.findSimilarProductIds(topInteractedProductIds);
    }

    Page<Product> productPage = productRepository.findRecommendedProducts(userId, userSkinType, similarProductIds, bigCategoryId, categoryId, pageable);
    List<Product> products = productPage.getContent();

    if (products.isEmpty()) {
      return ProductPageResponse.builder()
          .products(Collections.emptyList())
          .hasNext(false)
          .page(productPage.getNumber())
          .size(productPage.getSize())
          .totalCount(0)
          .build();
    }

    List<Long> productIds = products.stream()
        .map(Product::getProductId)
        .toList();

    // 1. 제품 좋아요 여부 한 번에 조회
    Set<Long> likedProductIds = productLikeRepository.findLikedProductIds(userId, productIds);

    // 2. 제품별 태그(고민) 정보 한 번에 조회
    List<ProductConcernCacheRepository.ConcernView> concernViews = productConcernCacheRepository.findConcernViewsByProductIds(productIds);

    Map<Long, List<String>> productConcernsMap = concernViews.stream()
            .collect(Collectors.groupingBy(
                    ProductConcernCacheRepository.ConcernView::getProductId,
                    Collectors.mapping(
                            view -> mapToDisplayName(view.getConcernName()), // 1. 예쁜 이름으로 변환
                            Collectors.collectingAndThen(Collectors.toSet(), ArrayList::new) // 2. Set으로 모아서 중복("안티에이징" 2개 등) 제거 후 List로 반환
                    )
            ));

    // 3. 제품 정보와 합쳐서 DTO 생성
    List<ProductSummaryResponse> productResponses = products.stream()
        .map(product -> {
          boolean isLiked = likedProductIds.contains(product.getProductId());
          List<String> concerns = productConcernsMap.getOrDefault(product.getProductId(), Collections.emptyList());
          return ProductSummaryResponse.from(product, isLiked, concerns);
        })
        .collect(Collectors.toList());

    return ProductPageResponse.builder()
        .products(productResponses)
        .hasNext(productPage.hasNext())
        .page(productPage.getNumber())
        .size(productPage.getSize())
        .totalCount(productPage.getTotalElements())
        .build();
  }

  // DB의 투박한 태그명을 프론트엔드용 예쁜 태그명으로 바꿔주는 매핑 메서드
  private String mapToDisplayName(String originalName) {
    if (originalName == null) return "";

    return switch (originalName) {
      case "기미/주근깨/잡티" -> "색소침착";
      case "주름/탄력", "노화방지-40대이상" -> "안티에이징";
      case "속건조" -> "수분";
      // 여드름, 미백, 피지, 블랙헤드, 진정, 각질 등은 DB 이름 그대로 사용
      default -> originalName;
    };
  }
}

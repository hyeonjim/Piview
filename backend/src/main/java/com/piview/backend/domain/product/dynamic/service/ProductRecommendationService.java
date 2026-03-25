package com.piview.backend.domain.product.dynamic.service;

import com.piview.backend.domain.product.catalog.dto.ProductPageResponse;
import com.piview.backend.domain.product.catalog.dto.ProductSummaryResponse;
import com.piview.backend.domain.product.catalog.repository.ProductConcernCacheRepository;
import com.piview.backend.domain.product.catalog.repository.ProductRepository;
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

  public ProductPageResponse getRecommendedProducts(Long userId, Integer bigCategoryId, Long categoryId, Pageable pageable) {

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
    
    // Null 안전한 처리: 피부타입이 없으면 null로 넘겨줌
    String userSkinType = (user.getMySkinType() != null) ? user.getMySkinType().name() : null;

    Page<Product> productPage = productRepository.findRecommendedProducts(userId, userSkinType, bigCategoryId, categoryId, pageable);
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
            Collectors.mapping(ProductConcernCacheRepository.ConcernView::getConcernName, Collectors.toList())
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
}

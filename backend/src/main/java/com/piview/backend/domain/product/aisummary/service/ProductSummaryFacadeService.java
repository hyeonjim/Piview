package com.piview.backend.domain.product.aisummary.service;

import com.piview.backend.domain.product.aisummary.dto.ProductLine12SummaryResponse;
import com.piview.backend.domain.product.catalog.repository.ProductIngredientRepository;
import com.piview.backend.domain.product.catalog.repository.ProductRepository;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.product.entity.ProductIngredients;
import com.piview.backend.domain.user.login.entity.User;
import com.piview.backend.domain.user.login.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class ProductSummaryFacadeService {

  private final UserRepository userRepository;
  private final ProductIngredientRepository productIngredientRepository;
  private final ProductRepository productRepository;
  private final AiSummaryAsyncService aiSummaryAsyncService;
  private final AiRecommendationService aiRecommendationService;

  @Transactional(readOnly = true)
  public CompletableFuture<ProductLine12SummaryResponse> getPersonalizedSummary(Long userId, Long productId) {

    // 사용자 정보 및 제품 정보 조회
    User user = userRepository.findByIdAndExistTrue(userId)
        .orElseThrow(() -> new IllegalArgumentException("해당 사용자를 찾을 수 없습니다."));
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 제품입니다. Product ID: " + productId));
    ProductIngredients productIngredients = productIngredientRepository.findByProductId(productId)
        .orElseThrow(() -> new IllegalArgumentException("해당 제품의 성분 정보를 찾을 수 없습니다."));

    // Line 2: DB 기반 사용자 피부 고민 맞춤형 메시지 생성 (동기 처리)
    String personalizedMessage = aiRecommendationService.generateLine2Message(userId, product);

    //  Line 1을 위한 LLM 프롬프트 Context 조립
    String userSkinType = (user.getMySkinType() != null) ? user.getMySkinType().name() : "알 수 없음";
    String rawIngredientsText = productIngredients.getProductIngredientsKo() != null
        ? productIngredients.getProductIngredientsKo()
        : "성분 정보 없음";

    String finalPromptContext = String.format(
        """
        [사용자 정보]
        피부 타입: %s

        [제품 원문 성분]
        %s
        """,
        userSkinType, rawIngredientsText
    );

    // 4. 비동기 LLM 호출 및 결과 조합
    // LLM의 응답이 도착하면(thenApply), 앞서 구한 personalizedMessage와 합쳐서 최종 DTO를 만듭니다.
    return aiSummaryAsyncService.getProductSummaryAsync(finalPromptContext)
        .thenApply(aiSummary -> ProductLine12SummaryResponse.builder()
            .productId(product.getProductId())
            .productName(product.getName())
            .line1AiSummary(aiSummary.getLine1())
            .line2PersonalizedMsg(personalizedMessage)
            .line3AiSummary(aiSummary.getLine3())
            .build()
        );
  }
}
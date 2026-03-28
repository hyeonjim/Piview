package com.piview.backend.domain.product.aisummary.service;

import com.piview.backend.domain.product.aisummary.dto.ProductLine12SummaryResponse;
import com.piview.backend.domain.product.catalog.repository.ProductConcernCacheRepository;
import com.piview.backend.domain.product.catalog.repository.ProductIngredientRepository;
import com.piview.backend.domain.product.catalog.repository.ProductRepository;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.product.entity.ProductIngredients;
import com.piview.backend.domain.skin.survey.entity.MySkin;
import com.piview.backend.domain.skin.survey.repository.MySkinRepository;
import com.piview.backend.domain.user.login.entity.User;
import com.piview.backend.domain.user.login.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
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
  private final ProductConcernCacheRepository productConcernCacheRepository;
  private final MySkinRepository mySkinRepository;

  @Transactional(readOnly = true)
  public CompletableFuture<ProductLine12SummaryResponse> getPersonalizedSummary(Long userId, Long productId) {

    // 사용자 정보 및 제품 정보 조회
    User user = userRepository.findByIdAndExistTrue(userId)
        .orElseThrow(() -> new IllegalArgumentException("해당 사용자를 찾을 수 없습니다."));
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 제품입니다. Product ID: " + productId));
    ProductIngredients productIngredients = productIngredientRepository.findByProductId(productId)
        .orElseThrow(() -> new IllegalArgumentException("해당 제품의 성분 정보를 찾을 수 없습니다."));

    List<String> topConcerns = productConcernCacheRepository.findTopConcernNamesByProductId(productId);

    // 점수가 높은 상위 3개만 잘라서 콤마(,)로 연결
    String productTags = topConcerns.stream()
        .limit(3)
        .collect(Collectors.joining(", "));

    // 만약 캐시 테이블에 데이터가 없다면 기본값 세팅
    if (productTags.isEmpty()) {
      productTags = "전반적인 피부 케어";
    }

    List<MySkin> mySkins = mySkinRepository.findAllByUserId(userId);
    String userConcerns = mySkins.isEmpty()
        ? "없음"
        : mySkins.stream().map(MySkin::getSkinProblem).collect(Collectors.joining(", "));

    String userSkinType = (user.getMySkinType() != null) ? user.getMySkinType().getKorean() : "알 수 없음";
    String rawIngredientsText = productIngredients.getProductIngredientsKo() != null
        ? productIngredients.getProductIngredientsKo()
        : "성분 정보 없음";

    String targetSkin = java.util.stream.Stream.of(product.getTopSkinType(), product.getTop2SkinType())
        .filter(java.util.Objects::nonNull)
        .map(Enum::name)
        .collect(Collectors.joining(", "));

    if (targetSkin.isEmpty()) {
      targetSkin = "모든 피부";
    }

    String categoryName = (product.getCategory() != null) ? product.getCategory().getCategoryName() : "스킨케어";

    String extraInstruction = "";
    if (categoryName.contains("클렌징") || categoryName.contains("폼") || categoryName.contains("워터")) {
      extraInstruction = """
          
          [특별 지시사항]
          🚨 이 제품은 씻어내는 '클렌징' 용도입니다. 절대 스킨케어(영양 흡수, 안티에이징 등)처럼 요약하지 마세요!
          - line2 작성 시: '세정력', '노폐물 제거', '세안 후 당김 없는 촉촉함' 위주로 어필할 것.
          - line3 작성 시: 성분 충돌보다는 '올바른 세안 팁'이나 '2차 세안 여부' 등 클렌징 꿀팁을 제공할 것.
          """;
    }

    String finalPromptContext = String.format(
        """
        [사용자 정보]
        피부 타입: %s
        피부 고민: %s

        [제품 정보]
        카테고리: %s
        추천 피부 타입: %s
        제품 태그: %s
        제품 원문 성분: %s
        """,
        userSkinType, userConcerns, categoryName, targetSkin, productTags, rawIngredientsText, extraInstruction
    );

    // 비동기 LLM 호출 및 결과 조합
    // LLM의 응답이 도착하면(thenApply), 앞서 구한 personalizedMessage와 합쳐서 최종 DTO를 만듭니다.
    return aiSummaryAsyncService.getProductSummaryAsync(finalPromptContext)
        .thenApply(aiSummary -> ProductLine12SummaryResponse.builder()
            .productId(product.getProductId())
            .productName(product.getName())
            .line1AiSummary(aiSummary.getLine1())
            .line2PersonalizedMsg(aiSummary.getLine2())
            .line3AiSummary(aiSummary.getLine3())
            .build()
        );
  }
}
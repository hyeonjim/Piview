package com.piview.backend.domain.product.aisummary.service;

import com.piview.backend.domain.product.aisummary.dto.AiComparisonResponse;
import com.piview.backend.domain.product.catalog.repository.ProductConcernCacheRepository;
import com.piview.backend.domain.product.catalog.repository.ProductRepository;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.skin.survey.entity.MySkin;
import com.piview.backend.domain.skin.survey.repository.MySkinRepository;
import com.piview.backend.domain.user.login.entity.User;
import com.piview.backend.domain.user.login.repository.UserRepository;
import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiCompareFacadeService {

  private final UserRepository userRepository;
  private final MySkinRepository mySkinRepository;
  private final ProductRepository productRepository;
  private final ProductConcernCacheRepository productConcernCacheRepository;
  private final AiCompareAsyncService aiCompareAsyncService; // 이전에 만든 Gemini 호출 서비스

  @Transactional(readOnly = true)
  public CompletableFuture<AiComparisonResponse> getAiComparisonSummary(Long userId, List<Long> productIds) {

    if (productIds == null || productIds.size() != 2) {
      throw new CustomException(ErrorCode.PRODUCT_COMPARE_REQUIRES_TWO_IDS);
    }

    Long prodIdA = productIds.get(0);
    Long prodIdB = productIds.get(1);

    // 1. 유저 및 피부 고민 조회
    User user = userRepository.findByIdAndExistTrue(userId)
        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    List<MySkin> mySkins = mySkinRepository.findAllByUserId(userId);

    // 2. 제품 이름 조회
    Product prodA = productRepository.findById(prodIdA)
        .orElseThrow(() -> new CustomException(ErrorCode.COSMETICS_NOT_FOUND));
    Product prodB = productRepository.findById(prodIdB)
        .orElseThrow(() -> new CustomException(ErrorCode.COSMETICS_NOT_FOUND));

    // 3. 제품 기능(태그) 조회
    List<String> tagsAList = productConcernCacheRepository.findTopConcernNamesByProductId(prodIdA);
    List<String> tagsBList = productConcernCacheRepository.findTopConcernNamesByProductId(prodIdB);

    // 4. 프롬프트용 문자열 정제
    String tagsA = tagsAList.isEmpty() ? "전반적인 케어" : tagsAList.stream().limit(3).collect(Collectors.joining(", "));
    String tagsB = tagsBList.isEmpty() ? "전반적인 케어" : tagsBList.stream().limit(3).collect(Collectors.joining(", "));

    String userSkinType = (user.getMySkinType() != null) ? user.getMySkinType().name() : "알 수 없음";
    String userConcerns = mySkins.isEmpty() ? "없음" : mySkins.stream().map(MySkin::getSkinProblem).collect(Collectors.joining(", "));

    String targetSkinA = java.util.stream.Stream.of(prodA.getTopSkinType(), prodA.getTop2SkinType())
        .filter(java.util.Objects::nonNull).map(Enum::name).collect(Collectors.joining(", "));
    String targetSkinB = java.util.stream.Stream.of(prodB.getTopSkinType(), prodB.getTop2SkinType())
        .filter(java.util.Objects::nonNull).map(Enum::name).collect(Collectors.joining(", "));

    // 5. 초거대 컨텍스트 조립
    String comparisonContext = String.format(
        """
        [사용자 피부 정보]
        피부 타입: %s
        피부 고민: %s

        [비교 대상 제품 A]
        제품명: %s
        추천 피부 타입: %s
        제품 기능(태그): %s

        [비교 대상 제품 B]
        제품명: %s
        추천 피부 타입: %s
        제품 기능(태그): %s
        """,
        userSkinType, userConcerns,
        prodA.getName(), targetSkinA.isEmpty() ? "모든 피부" : targetSkinA, tagsA,
        prodB.getName(), targetSkinB.isEmpty() ? "모든 피부" : targetSkinB, tagsB
    );

    // 6. 비동기 LLM 호출 및 DTO 래핑
    return aiCompareAsyncService.compareProductsAsync(comparisonContext)
        .thenApply(response -> new AiComparisonResponse(response.getComparisonText()));
  }
}

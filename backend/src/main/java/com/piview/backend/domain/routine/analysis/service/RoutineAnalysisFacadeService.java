package com.piview.backend.domain.routine.analysis.service;

import com.piview.backend.domain.product.catalog.repository.ProductConcernCacheRepository;
import com.piview.backend.domain.product.catalog.repository.ProductIngredientRepository;
import com.piview.backend.domain.product.catalog.repository.ProductRepository;
import com.piview.backend.domain.product.catalog.repository.SkinConcernsRepository;
import com.piview.backend.domain.product.entity.CategoryIdealScore;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.product.entity.SkinConcerns;
import com.piview.backend.domain.product.recommend.repository.CategoryIdealScoreRepository;
import com.piview.backend.domain.routine.analysis.dto.response.RoutineAnalysisResponse;
import com.piview.backend.domain.skin.common.SkinTypeEnum;
import com.piview.backend.domain.skin.survey.entity.MySkin;
import com.piview.backend.domain.skin.survey.entity.SurveyGender;
import com.piview.backend.domain.skin.survey.repository.MySkinRepository;
import com.piview.backend.domain.user.disliked.repository.MyAvoidContriRepository;
import com.piview.backend.domain.user.disliked.repository.MyDislikeProductRepository;
import com.piview.backend.domain.user.login.entity.User;
import com.piview.backend.domain.user.login.repository.UserRepository;
import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoutineAnalysisFacadeService {

    private final UserRepository userRepository;
    private final MySkinRepository mySkinRepository;
    private final CategoryIdealScoreRepository categoryIdealScoreRepository;
    private final ProductIngredientRepository productIngredientRepository;
    private final ProductRepository productRepository;
    private final MyDislikeProductRepository myDislikeProductRepository;
    private final MyAvoidContriRepository myAvoidContriRepository;
    private final SkinConcernsRepository skinConcernsRepository;
    private final ProductConcernCacheRepository productConcernCacheRepository;
    private final RoutineAnalysisAiClient routineAnalysisAiClient;

    // 피부타입별 상위 25% 컷오프 기준값 (findInitialRecommendations 쿼리와 동일)
    private static final Map<SkinTypeEnum, Double> SKIN_SCORE_THRESHOLD = Map.of(
        SkinTypeEnum.dry, 66.0,
        SkinTypeEnum.oily, 70.0,
        SkinTypeEnum.combination, 39.0,
        SkinTypeEnum.subuji, 36.0
    );

    private static final Map<Long, List<Long>> COLUMN_TO_CATEGORY_IDS = Map.of(
        1L, List.of(8L, 9L, 10L, 11L, 12L, 13L),
        2L, List.of(22L),
        3L, List.of(1L, 7L, 5L, 16L),
        4L, List.of(3L, 21L),
        5L, List.of(2L, 17L, 19L),
        6L, List.of(4L, 6L, 18L),
        7L, List.of(14L, 15L, 20L)
    );

    @Transactional(readOnly = true)
    public CompletableFuture<RoutineAnalysisResponse> analyzeRoutine(Long userId, List<Long> productIds) {

        // 1. 유저 조회
        User user = userRepository.findByIdAndExistTrue(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (productIds == null || productIds.isEmpty()) {
            throw new CustomException(ErrorCode.EMPTY_ROUTINE_DRAFT);
        }

        // 2. 피부 타입(한글) + 고민 조회
        String userSkinType = (user.getMySkinType() != null) ? user.getMySkinType().getKorean() : "알 수 없음";
        SkinTypeEnum skinTypeEnum = user.getMySkinType();
        List<MySkin> mySkins = mySkinRepository.findAllByUserId(userId);
        String userConcerns = mySkins.isEmpty()
                ? "없음"
                : mySkins.stream().map(MySkin::getSkinProblem).collect(Collectors.joining(", "));

        // 3. productIds 기반 제품 정보 일괄 조회
        List<Product> products = productRepository.findByProductIdIn(productIds);

        // 4. 성분 일괄 조회
        Map<Long, String> ingredientMap = productIngredientRepository.findByProductIds(productIds)
                .stream()
                .collect(Collectors.toMap(
                        pi -> pi.getProduct().getProductId(),
                        pi -> pi.getProductIngredientsKo() != null
                                ? pi.getProductIngredientsKo() : "성분 정보 없음"
                ));

        // 5. 이상치 일괄 조회
        List<Long> routineColIds = products.stream()
                .map(this::getCategoryToColumnId)
                .filter(id -> id != -1L)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, CategoryIdealScore> idealScoreMap = (skinTypeEnum != null && !routineColIds.isEmpty())
                ? categoryIdealScoreRepository
                        .findBySkinTypeAndRoutineColIdIn(skinTypeEnum, routineColIds)
                        .stream()
                        .collect(Collectors.toMap(CategoryIdealScore::getRoutineColId, s -> s))
                : Map.of();

        // 6. 추천 필터용 유저 데이터 준비
        List<Long> dislikedProductIds = myDislikeProductRepository.findProductIdsByUserId(userId);
        List<Long> safeDislikedIds = dislikedProductIds.isEmpty() ? List.of(-1L) : dislikedProductIds;

        List<Long> excludeProductIds = new ArrayList<>(dislikedProductIds);
        excludeProductIds.addAll(productIds);
        List<Long> safeExcludeIds = excludeProductIds.isEmpty() ? List.of(-1L) : excludeProductIds;

        List<Long> avoidIngredientIds = myAvoidContriRepository
                .findAllByUserIdWithIngredient(userId)
                .stream()
                .map(mac -> mac.getIngredient().getIngredientId())
                .collect(Collectors.toList());
        List<Long> safeAvoidIngredientIds = avoidIngredientIds.isEmpty() ? List.of(-1L) : avoidIngredientIds;

        // 피부 고민 → concernId 매핑
        List<SkinConcerns> allConcerns = skinConcernsRepository.findAllByOrderByIdAsc();
        Map<String, Long> concernNameToId = allConcerns.stream()
                .collect(Collectors.toMap(SkinConcerns::getConcernName, SkinConcerns::getId));

        Long primaryConcernId = mySkins.isEmpty() ? -1L
                : concernNameToId.getOrDefault(mySkins.get(0).getSkinProblem(), -1L);

        SurveyGender gender = user.getGender() != null ? user.getGender() : SurveyGender.WOMEN;
        SkinTypeEnum skinType = skinTypeEnum != null ? skinTypeEnum : SkinTypeEnum.dry;

        // 7. 성분 충돌 감지
        StringBuilder conflictSection = new StringBuilder();
        detectConflicts(products, conflictSection);

        // 8. 피부 고민 커버 체크
        Set<Long> coveredConcernIds = productConcernCacheRepository
                .findCoveredConcernIdsByProductIds(productIds)
                .stream()
                .collect(Collectors.toSet());

        StringBuilder uncoveredSection = new StringBuilder();
        for (MySkin mySkin : mySkins) {
            Long concernId = concernNameToId.getOrDefault(mySkin.getSkinProblem(), -1L);
            if (concernId == -1L || coveredConcernIds.contains(concernId)) continue;

            List<Long> searchCategoryIds = COLUMN_TO_CATEGORY_IDS.getOrDefault(4L, List.of());
            List<Product> candidates = productRepository.findRoutineCandidates(
                    searchCategoryIds, skinType, gender,
                    concernId, 2.0, 1.0,
                    safeExcludeIds, safeDislikedIds, safeAvoidIngredientIds
            );

            uncoveredSection.append(String.format("\n[피부 고민 '%s' 케어 제품 없음 — 추천 후보]\n",
                    mySkin.getSkinProblem()));
            if (candidates.isEmpty()) {
                uncoveredSection.append("- 적합한 추천 후보 없음\n");
            } else {
                candidates.stream().limit(2).forEach(c -> {
                    String bName = c.getBrand() != null ? c.getBrand().getBrandName() : "";
                    String tags = getTopConcernTags(c.getProductId());
                    uncoveredSection.append(String.format("- %s %s (%s)\n", bName, c.getName(), tags));
                });
            }
        }

        // 9. 제품별 이상치 분석 + 피부타입 점수 + 이상치 미달 추천
        StringBuilder routineSection = new StringBuilder("[루틴 구성 및 분석 데이터]\n");
        StringBuilder recommendSection = new StringBuilder();
        boolean hasImprovements = false;

        for (Product product : products) {
            String productName = product.getName();
            String categoryName = product.getCategory() != null
                    ? product.getCategory().getCategoryName() : "카테고리 없음";
            String brandName = product.getBrand() != null ? product.getBrand().getBrandName() : "";
            Long routineColId = getCategoryToColumnId(product);
            String ingredients = ingredientMap.getOrDefault(product.getProductId(), "성분 정보 없음");

            // ── 피부타입 점수 분석
            String skinScoreInfo = buildSkinScoreInfo(product, skinTypeEnum);

            // ── 이상치 분석
            String idealInfo = "";
            boolean needsImprovement = false;
            CategoryIdealScore ideal = idealScoreMap.get(routineColId);

            if (ideal != null) {
                BigDecimal idealM = ideal.getIdealM();
                BigDecimal idealO = ideal.getIdealO();
                BigDecimal productM = product.getMScore();
                BigDecimal productO = product.getOScore();

                if (productM != null && productO != null) {
                    boolean mDeficient = productM.compareTo(idealM.multiply(BigDecimal.valueOf(0.8))) < 0;
                    boolean oDeficient = productO.compareTo(idealO.multiply(BigDecimal.valueOf(0.8))) < 0;
                    needsImprovement = mDeficient || oDeficient;

                    String mStatus = mDeficient ? "수분 부족 ⚠️" : "수분 충족 ✅";
                    String oStatus = oDeficient ? "유분 부족 ⚠️" : "유분 충족 ✅";
                    idealInfo = String.format(" | %s / %s", mStatus, oStatus);
                } else {
                    idealInfo = " | 수분/유분 데이터 없음 (이상치 비교 불가)";
                }
            }

            // ── 성분 정보 (없으면 명시)
            String ingredientInfo = ingredients.equals("성분 정보 없음")
                    ? "성분 정보 없음 (성분 관련 언급 금지)"
                    : (ingredients.length() > 200 ? ingredients.substring(0, 200) + "..." : ingredients);

            routineSection.append(String.format(
                    "- %s %s (%s)\n  피부타입 적합도: %s\n  이상치: %s\n  성분: %s\n",
                    brandName, productName, categoryName,
                    skinScoreInfo, idealInfo.isEmpty() ? "이상치 데이터 없음" : idealInfo,
                    ingredientInfo
            ));

            if (needsImprovement) hasImprovements = true;

            // 이상치 미달 추천
            if (needsImprovement && ideal != null && routineColId != -1L) {
                List<Long> categoryIds = COLUMN_TO_CATEGORY_IDS.getOrDefault(routineColId, List.of());
                if (!categoryIds.isEmpty()) {
                    List<Product> candidates = productRepository.findRoutineCandidates(
                            categoryIds, skinType, gender,
                            primaryConcernId,
                            ideal.getIdealM().doubleValue(),
                            ideal.getIdealO().doubleValue(),
                            safeExcludeIds, safeDislikedIds, safeAvoidIngredientIds
                    );
                    if (!candidates.isEmpty()) {
                        recommendSection.append(String.format("\n[%s 단계 수분/유분 보완 추천 후보]\n", categoryName));
                        candidates.stream().limit(2).forEach(c -> {
                            String cBrand = c.getBrand() != null ? c.getBrand().getBrandName() : "";
                            String tags = getTopConcernTags(c.getProductId());
                            recommendSection.append(String.format("- %s %s (%s)\n", cBrand, c.getName(), tags));
                        });
                    }
                }
            }
        }

        if (uncoveredSection.length() > 0 || conflictSection.length() > 0) {
            hasImprovements = true;
        }

        // 10. 프롬프트 조립
        String context = String.format(
                """
                [사용자 피부 정보]
                피부 타입: %s
                피부 고민: %s

                %s
                %s
                %s
                %s
                [지시사항 — 반드시 준수할 것]
                1. 위에 제공된 데이터만 사용할 것. 제공되지 않은 정보는 절대 추측하거나 지어내지 말 것.
                2. "성분 정보 없음 (성분 관련 언급 금지)"이면 해당 제품의 성분에 대해 절대 언급하지 말 것.
                3. "측정불가"로 표시된 수분/유분 값은 비교하지 말 것.
                4. 피부타입 적합도가 "❌부적합"이면 반드시 경고할 것.
                5. %s
                6. 보완이 필요한 항목이 있으면 추천 후보 중 실제 제품명(브랜드 포함)을 언급하며 추천할 것.
                7. 추천 시 "~을 추가해보세요" 또는 "~가 도움이 될 거예요" 형식으로 말할 것.
                8. 성분 충돌이 있으면 구체적으로 경고할 것.
                """,
                userSkinType, userConcerns,
                routineSection,
                conflictSection.length() > 0 ? conflictSection.toString() : "",
                uncoveredSection.length() > 0 ? uncoveredSection.toString() : "",
                recommendSection.length() > 0 ? recommendSection.toString() : "",
                hasImprovements
                        ? "개선이 필요한 항목만 간결하게 언급하고 불필요한 칭찬은 하지 말 것."
                        : "모든 데이터가 양호하므로 칭찬하되, 데이터에 근거한 구체적인 이유를 언급할 것."
        );

        log.debug("루틴 분석 프롬프트:\n{}", context);
        return routineAnalysisAiClient.analyzeRoutineAsync(context);
    }

    // 피부타입 점수 분석 — 수치 없이 판단 결과만 반환
    private String buildSkinScoreInfo(Product product, SkinTypeEnum skinTypeEnum) {
        if (skinTypeEnum == null) return "피부타입 정보 없음";

        BigDecimal score = switch (skinTypeEnum) {
            case dry -> product.getScoreDry();
            case oily -> product.getScoreOily();
            case combination -> product.getScoreCombination();
            case subuji -> product.getScoreSubuji();
        };

        if (score == null) return "피부타입 점수 데이터 없음";

        double threshold = SKIN_SCORE_THRESHOLD.getOrDefault(skinTypeEnum, 50.0);
        boolean isSuitable = score.doubleValue() >= threshold;

        return isSuitable
                ? skinTypeEnum.getKorean() + " 피부에 잘 맞는 제품 ✅"
                : skinTypeEnum.getKorean() + " 피부에 맞지 않는 제품 ❌ (이 제품은 회원님 피부타입에 적합하지 않습니다)";
    }

    private Long getCategoryToColumnId(Product product) {
        if (product.getCategory() == null) return -1L;
        Long categoryId = product.getCategory().getCategoryId();
        for (Map.Entry<Long, List<Long>> entry : COLUMN_TO_CATEGORY_IDS.entrySet()) {
            if (entry.getValue().contains(categoryId)) return entry.getKey();
        }
        return -1L;
    }

    private void detectConflicts(List<Product> products, StringBuilder conflictSection) {
        boolean hasRetinol = products.stream().anyMatch(p -> Boolean.TRUE.equals(p.getHasRetinol()));
        boolean hasAcid = products.stream().anyMatch(p -> Boolean.TRUE.equals(p.getHasAcid()));
        boolean hasPureVitC = products.stream().anyMatch(p -> Boolean.TRUE.equals(p.getHasPureVitC()));
        boolean hasBenzoyl = products.stream().anyMatch(p -> Boolean.TRUE.equals(p.getHasBenzoyl()));
        boolean hasCopperPep = products.stream().anyMatch(p -> Boolean.TRUE.equals(p.getHasCopperPep()));

        List<String> conflicts = new ArrayList<>();
        if (hasRetinol && hasAcid) conflicts.add("레티놀 + AHA/BHA (자극 및 피부 장벽 손상 위험)");
        if (hasRetinol && hasPureVitC) conflicts.add("레티놀 + 순수 비타민C (산화 반응으로 효과 감소)");
        if (hasRetinol && hasCopperPep) conflicts.add("레티놀 + 구리 펩타이드 (효과 상쇄)");
        if (hasBenzoyl && hasAcid) conflicts.add("벤조일퍼옥사이드 + AHA/BHA (과도한 자극)");
        if (hasPureVitC && hasCopperPep) conflicts.add("순수 비타민C + 구리 펩타이드 (성분 불안정)");

        if (!conflicts.isEmpty()) {
            conflictSection.append("[성분 충돌 감지]\n");
            conflicts.forEach(c -> conflictSection.append("- ").append(c).append("\n"));
        }
    }

    private String getTopConcernTags(Long productId) {
        List<String> concerns = productConcernCacheRepository.findTopConcernNamesByProductId(productId);
        return concerns.stream().limit(2).collect(Collectors.joining("/"));
    }
}

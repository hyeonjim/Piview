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

    private static final Map<Long, List<Long>> COLUMN_TO_CATEGORY_IDS = Map.of(
        1L, List.of(8L, 9L, 10L, 11L, 12L, 13L),  // 클렌저
        2L, List.of(22L),                            // 쉐이빙
        3L, List.of(1L, 7L, 5L, 16L),               // 스킨/토너/미스트/패드
        4L, List.of(3L, 21L),                        // 세럼/에센스/앰플
        5L, List.of(2L, 17L, 19L),                  // 로션/에멀전/올인원
        6L, List.of(4L, 6L, 18L),                   // 크림/페이스오일
        7L, List.of(14L, 15L, 20L)                  // 선크림/선스틱
    );

    @Transactional(readOnly = true)
    public CompletableFuture<RoutineAnalysisResponse> analyzeRoutine(Long userId, List<Long> productIds) {

        // 1. 유저 조회
        User user = userRepository.findByIdAndExistTrue(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (productIds == null || productIds.isEmpty()) {
            throw new CustomException(ErrorCode.EMPTY_ROUTINE_DRAFT);
        }

        // 2. 피부 타입 + 고민 조회
        String userSkinType = user.getMySkinType() != null ? user.getMySkinType().getKorean() : "알 수 없음";
        SkinTypeEnum skinTypeEnum = user.getMySkinType();
        List<MySkin> mySkins = mySkinRepository.findAllByUserId(userId);
        String userConcerns = mySkins.isEmpty()
                ? "없음"
                : mySkins.stream().map(MySkin::getSkinProblem).collect(Collectors.joining(", "));

        // 3. 제품 일괄 조회
        List<Product> products = productRepository.findByProductIdIn(productIds);

        // 4. 성분 일괄 조회
        Map<Long, String> ingredientMap = productIngredientRepository.findByProductIds(productIds)
                .stream()
                .collect(Collectors.toMap(
                        pi -> pi.getProduct().getProductId(),
                        pi -> pi.getProductIngredientsKo() != null
                                ? pi.getProductIngredientsKo() : "성분 정보 없음"
                ));

        // 5. 이상치 일괄 조회 (클렌저·쉐이빙 제외 스텝)
        List<Long> routineColIds = products.stream()
                .map(this::getCategoryToColumnId)
                .filter(id -> id > 2L)  // 클렌저(1), 쉐이빙(2) 제외
                .distinct()
                .collect(Collectors.toList());

        Map<Long, CategoryIdealScore> idealScoreMap = (skinTypeEnum != null && !routineColIds.isEmpty())
                ? categoryIdealScoreRepository
                        .findBySkinTypeAndRoutineColIdIn(skinTypeEnum, routineColIds)
                        .stream()
                        .collect(Collectors.toMap(CategoryIdealScore::getRoutineColId, s -> s))
                : Map.of();

        // 6. 추천 필터용 유저 데이터
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

        Map<String, Long> internalTagToConcernId = new java.util.HashMap<>();
        internalTagToConcernId.put("색소침착", concernNameToId.getOrDefault("기미/주근깨/잡티", -1L));
        internalTagToConcernId.put("안티에이징", concernNameToId.getOrDefault("주름/탄력", -1L));
        internalTagToConcernId.put("수분", concernNameToId.getOrDefault("속건조", -1L));

        Long primaryConcernId = mySkins.isEmpty() ? -1L
                : resolveConcernId(mySkins.get(0).getSkinProblem(), concernNameToId, internalTagToConcernId);

        SurveyGender gender = user.getGender() != null ? user.getGender() : SurveyGender.WOMEN;
        SkinTypeEnum skinType = skinTypeEnum != null ? skinTypeEnum : SkinTypeEnum.dry;

        // 7. 성분 충돌 감지
        StringBuilder conflictSection = new StringBuilder();
        detectConflicts(products, conflictSection);

        // 8. 피부 고민 커버 체크 — "부족하다" 대신 "추가하면 좋아요" 톤으로 변경
        Set<Long> coveredConcernIds = productConcernCacheRepository
                .findCoveredConcernIdsByProductIds(productIds)
                .stream()
                .collect(Collectors.toSet());

        List<Long> allCategoryIds = COLUMN_TO_CATEGORY_IDS.values().stream()
                .flatMap(List::stream)
                .collect(Collectors.toList());

        StringBuilder addOnSection = new StringBuilder();
        for (MySkin mySkin : mySkins) {
            Long concernId = resolveConcernId(mySkin.getSkinProblem(), concernNameToId, internalTagToConcernId);
            if (concernId == -1L || coveredConcernIds.contains(concernId)) continue;

            List<Product> candidates = productRepository.findRoutineCandidates(
                    allCategoryIds, skinType, gender,
                    concernId, 2.0, 1.0,
                    safeExcludeIds, safeDislikedIds, safeAvoidIngredientIds
            );

            addOnSection.append(String.format("\n[%s 케어를 더 강화하고 싶다면]\n", mySkin.getSkinProblem()));
            if (candidates.isEmpty()) {
                addOnSection.append("- 현재 적합한 추가 후보를 찾기 어려워요\n");
            } else {
                candidates.stream().limit(2).forEach(c -> {
                    String bName = c.getBrand() != null ? c.getBrand().getBrandName() : "";
                    String tags = getTopConcernTags(c.getProductId());
                    addOnSection.append(String.format("- %s %s (%s)\n", bName, c.getName(), tags));
                });
            }
        }

        // 9. ★ 핵심 변경 — 제품별 이상치 비교 → 루틴 전체 유수분 밸런스 합산
        //    추천 시스템(RoutineSessionService)과 동일한 deficit 방식으로 통일
        double totalDeficitM = 0.0;
        double totalDeficitO = 0.0;
        double totalIdealM = 0.0;
        double totalIdealO = 0.0;

        for (Product product : products) {
            Long routineColId = getCategoryToColumnId(product);
            if (routineColId <= 2L || routineColId == -1L) continue;  // 클렌저·쉐이빙 제외
            CategoryIdealScore ideal = idealScoreMap.get(routineColId);
            if (ideal == null) continue;

            double pM = product.getMScore() != null ? product.getMScore().doubleValue() : 0.0;
            double pO = product.getOScore() != null ? product.getOScore().doubleValue() : 0.0;
            totalDeficitM += (ideal.getIdealM().doubleValue() - pM);
            totalDeficitO += (ideal.getIdealO().doubleValue() - pO);
            totalIdealM   += ideal.getIdealM().doubleValue();
            totalIdealO   += ideal.getIdealO().doubleValue();
        }

        // 달성률 계산 (0~1.0, 초과 달성도 1.0으로 캡)
        double mRatio = totalIdealM > 0 ? Math.min(1.0, Math.max(0, 1.0 - totalDeficitM / totalIdealM)) : 1.0;
        double oRatio = totalIdealO > 0 ? Math.min(1.0, Math.max(0, 1.0 - totalDeficitO / totalIdealO)) : 1.0;

        // 70% 이상은 충족으로 처리 (추천 제품이 이상치를 100% 채우기 어려운 구조 반영)
        // 40% 미만일 때만 실제 ⚠️ — 그 사이 구간은 약한 팁 수준으로만 전달
        String mStatus = mRatio >= 0.7 ? "수분 충족 ✅" : mRatio >= 0.4 ? "수분 약간 부족 (팁 수준 💡)" : "수분 부족 ⚠️";
        String oStatus = oRatio >= 0.7 ? "유분 충족 ✅" : oRatio >= 0.4 ? "유분 약간 부족 (팁 수준 💡)" : "유분 부족 ⚠️";

        // 40% 미달일 때만 실제 개선 필요 — 팁 수준(💡)은 문제로 간주하지 않음
        boolean hasBalanceIssue = mRatio < 0.4 || oRatio < 0.4;

        String balanceSummary = String.format(
                "[루틴 전체 유수분 밸런스] %s / %s", mStatus, oStatus
        );

        // 10. 제품별 분석 섹션 — 이상치 per-product ⚠️ 제거, 피부타입 적합도 + 성분만 유지
        StringBuilder routineSection = new StringBuilder("[루틴 구성 및 분석 데이터]\n");
        boolean hasSkinTypeMismatch = false;

        for (Product product : products) {
            String categoryName = product.getCategory() != null
                    ? product.getCategory().getCategoryName() : "카테고리 없음";
            String brandName    = product.getBrand() != null ? product.getBrand().getBrandName() : "";
            String ingredients  = ingredientMap.getOrDefault(product.getProductId(), "성분 정보 없음");

            String skinScoreInfo = buildSkinScoreInfo(product, skinTypeEnum);
            if (skinScoreInfo.contains("❌")) hasSkinTypeMismatch = true;

            String ingredientInfo = ingredients.equals("성분 정보 없음")
                    ? "성분 정보 없음 (성분 관련 언급 금지)"
                    : ingredients;

            // 충돌주의성분은 per-product에서 제거 — detectConflicts()가 감지한 실제 충돌만 conflictSection으로 전달
            // (AI가 단일 제품의 성분 플래그를 보고 없는 충돌을 만들어내는 문제 방지)
            routineSection.append(String.format(
                    "- %s %s (%s)\n  피부타입 적합도: %s\n  성분: %s\n",
                    brandName, product.getName(), categoryName,
                    skinScoreInfo, ingredientInfo
            ));
        }

        // 전체 유수분 밸런스 요약을 루틴 섹션 마지막에 추가
        routineSection.append("\n").append(balanceSummary).append("\n");

        // 11. 유수분 보완 추천 — 전체 밸런스 문제가 있을 때만, 가장 deficit이 큰 스텝 기준
        StringBuilder recommendSection = new StringBuilder();
        if (hasBalanceIssue) {
            // 스텝별 deficit을 계산해 가장 부족한 스텝에서만 추천
            double worstDeficit = 0.0;
            Long worstColId = null;
            String worstStepName = "";

            for (Map.Entry<Long, CategoryIdealScore> entry : idealScoreMap.entrySet()) {
                Long colId = entry.getKey();
                CategoryIdealScore ideal = entry.getValue();

                List<Product> stepProducts = products.stream()
                        .filter(p -> getCategoryToColumnId(p).equals(colId))
                        .collect(Collectors.toList());
                if (stepProducts.isEmpty()) continue;

                double stepM = stepProducts.stream()
                        .mapToDouble(p -> p.getMScore() != null ? p.getMScore().doubleValue() : 0.0)
                        .sum();
                double stepO = stepProducts.stream()
                        .mapToDouble(p -> p.getOScore() != null ? p.getOScore().doubleValue() : 0.0)
                        .sum();

                double stepDeficit = (ideal.getIdealM().doubleValue() - stepM)
                                   + (ideal.getIdealO().doubleValue() - stepO);

                if (stepDeficit > worstDeficit) {
                    worstDeficit = stepDeficit;
                    worstColId   = colId;
                    worstStepName = stepProducts.get(0).getCategory() != null
                            ? stepProducts.get(0).getCategory().getCategoryName() : "해당 단계";
                }
            }

            if (worstColId != null) {
                List<Long> categoryIds = COLUMN_TO_CATEGORY_IDS.getOrDefault(worstColId, List.of());
                CategoryIdealScore ideal = idealScoreMap.get(worstColId);
                if (!categoryIds.isEmpty() && ideal != null) {
                    List<Product> candidates = productRepository.findRoutineCandidates(
                            categoryIds, skinType, gender,
                            primaryConcernId,
                            ideal.getIdealM().doubleValue(),
                            ideal.getIdealO().doubleValue(),
                            safeExcludeIds, safeDislikedIds, safeAvoidIngredientIds
                    );
                    if (!candidates.isEmpty()) {
                        recommendSection.append(String.format("\n[%s 단계 보완 추천 후보]\n", worstStepName));
                        candidates.stream().limit(2).forEach(c -> {
                            String cBrand = c.getBrand() != null ? c.getBrand().getBrandName() : "";
                            String tags   = getTopConcernTags(c.getProductId());
                            recommendSection.append(String.format("- %s %s (%s)\n", cBrand, c.getName(), tags));
                        });
                    }
                }
            }
        }

        // 12. ★ hasImprovements — 실제 문제(피부타입 불일치·유수분 심각 부족·충돌)가 있을 때만 true
        //     addOnSection(고민 커버)은 부정적 신호가 아니므로 제외
        boolean hasImprovements = hasSkinTypeMismatch || hasBalanceIssue || conflictSection.length() > 0;

        // 13. 피부타입별 루틴 가이드 (AI 컨텍스트 첫머리에 추가)
        String skinTypeGuide = buildSkinTypeRoutineGuide(skinTypeEnum);

        // 14. 프롬프트 조립
        String context = String.format(
                """
                [사용자 피부 정보]
                피부 타입: %s
                피부 고민: %s

                %s

                %s
                %s
                %s
                %s
                [지시사항 — 반드시 준수할 것]
                1. 위에 제공된 데이터만 사용할 것. 제공되지 않은 정보는 절대 추측하거나 지어내지 말 것.
                2. "성분 정보 없음 (성분 관련 언급 금지)"이면 해당 제품의 성분에 대해 절대 언급하지 말 것.
                3. 피부타입 적합도가 "❌"인 제품은 반드시 경고할 것.
                4. [루틴 전체 유수분 밸런스]를 기준으로 수분/유분을 평가할 것. 제품 개별로 수분/유분을 평가하지 말 것.
                5. 충돌주의성분이 "없음"이 아닌 제품이 루틴에 2개 이상 있을 때만 성분 충돌을 경고할 것.
                6. [피부타입 루틴 가이드]를 바탕으로 첫 문장은 이 피부타입 루틴 전체의 방향을 1줄로 총평할 것.
                7. [추가 고민 케어 제안]이 있으면 "~도 추가해보면 더 좋을 것 같아요" 형식으로 마지막에 부드럽게 언급할 것. "부족하다"는 표현은 쓰지 말 것.
                8. 보완 추천 후보가 있으면 실제 제품명(브랜드 포함)을 직접 언급하며 추천할 것.
                9. %s
                """,
                userSkinType, userConcerns,
                skinTypeGuide,
                routineSection,
                conflictSection.length() > 0 ? conflictSection.toString() : "",
                addOnSection.length() > 0 ? addOnSection.toString() : "",
                recommendSection.length() > 0 ? recommendSection.toString() : "",
                hasImprovements
                        ? "개선이 필요한 항목만 간결하게 언급하고, 불필요한 칭찬은 하지 말 것. 문제 항목과 추천 제품을 중심으로 말할 것."
                        : "루틴의 모든 항목이 양호하므로 구체적인 데이터 근거를 들어 칭찬할 것. 개선 사항은 언급하지 말 것."
        );

        log.debug("루틴 분석 프롬프트:\n{}", context);
        return routineAnalysisAiClient.analyzeRoutineAsync(context);
    }

    // ── 피부타입별 루틴 케어 가이드 (AI 컨텍스트용)
    private String buildSkinTypeRoutineGuide(SkinTypeEnum skinType) {
        if (skinType == null) return "";
        return switch (skinType) {
            case dry -> """
                    [건성 피부 루틴 가이드]
                    클렌저는 크림·밤 타입이 피부 장벽을 덜 손상시킵니다.
                    토너는 글리세린·히알루론산 계열로 수분층을 충분히 쌓는 것이 핵심입니다.
                    세럼·에센스는 보습 집중 케어 단계로, 루틴에서 가장 중요한 포인트입니다.
                    크림은 유분감 있는 리치한 제형으로 수분을 잠가줘야 합니다.
                    선크림은 수분감 있는 크림 타입이 추가 건조를 방지합니다.
                    """;
            case oily -> """
                    [지성 피부 루틴 가이드]
                    클렌저는 폼·젤 타입으로 과잉 피지를 효과적으로 제거합니다.
                    토너는 모공 케어와 피지 조절 성분(BHA·나이아신아마이드)이 중요합니다.
                    세럼은 가볍고 수분 위주로, 유분 성분은 최소화하는 것이 좋습니다.
                    크림은 가벼운 로션 또는 젤 크림이 지성 피부에 적합합니다.
                    선크림은 무오일·워터 베이스 제형이 번들거림을 줄입니다.
                    """;
            case combination -> """
                    [복합성 피부 루틴 가이드]
                    클렌저는 거품 적당하고 자극 없는 제품으로 T존·U존 균형을 맞춥니다.
                    토너는 수분 공급과 피지 조절을 동시에 할 수 있는 제품이 효과적입니다.
                    세럼은 나이아신아마이드 계열이 보습과 피지 조절을 함께 합니다.
                    크림은 너무 무겁지 않은 중간 질감이 T존 번들거림을 방지합니다.
                    """;
            case subuji -> """
                    [수부지 피부 루틴 가이드]
                    클렌저는 순한 저자극 제품으로 속건조를 악화시키지 않아야 합니다.
                    토너는 수분 공급 최우선이며, 강한 각질 제거제는 주의가 필요합니다.
                    세럼은 수분 충전 위주이면서 피지 과잉 부위 진정 효과도 있으면 이상적입니다.
                    크림은 수분감 있되 너무 기름지지 않은 제품이 균형을 맞춥니다.
                    """;
        };
    }

    // ── 피부타입 적합도 — topSkinType / top2SkinType 일치 여부 (기존 유지)
    private String buildSkinScoreInfo(Product product, SkinTypeEnum skinTypeEnum) {
        if (skinTypeEnum == null) return "피부타입 정보 없음";
        boolean isSuitable = skinTypeEnum.equals(product.getTopSkinType())
                || skinTypeEnum.equals(product.getTop2SkinType());
        return isSuitable
                ? skinTypeEnum.getKorean() + " 피부에 잘 맞는 제품 ✅"
                : skinTypeEnum.getKorean() + " 피부에 맞지 않는 제품 ❌ (이 제품은 회원님 피부타입에 적합하지 않습니다)";
    }

    // ── my_skin 태그 → concern_id 역매핑 헬퍼
    private Long resolveConcernId(String skinProblem, Map<String, Long> concernNameToId,
                                   Map<String, Long> internalTagToConcernId) {
        Long directId = concernNameToId.get(skinProblem);
        if (directId != null) return directId;
        return internalTagToConcernId.getOrDefault(skinProblem, -1L);
    }

    // ── 제품 카테고리 → 루틴 컬럼 ID 매핑
    private Long getCategoryToColumnId(Product product) {
        if (product.getCategory() == null) return -1L;
        Long categoryId = product.getCategory().getCategoryId();
        for (Map.Entry<Long, List<Long>> entry : COLUMN_TO_CATEGORY_IDS.entrySet()) {
            if (entry.getValue().contains(categoryId)) return entry.getKey();
        }
        return -1L;
    }

    // ── 성분 충돌 감지 (기존 유지)
    private void detectConflicts(List<Product> products, StringBuilder conflictSection) {
        boolean hasRetinol  = products.stream().anyMatch(p -> Boolean.TRUE.equals(p.getHasRetinol()));
        boolean hasAcid     = products.stream().anyMatch(p -> Boolean.TRUE.equals(p.getHasAcid()));
        boolean hasPureVitC = products.stream().anyMatch(p -> Boolean.TRUE.equals(p.getHasPureVitC()));
        boolean hasBenzoyl  = products.stream().anyMatch(p -> Boolean.TRUE.equals(p.getHasBenzoyl()));
        boolean hasCopperPep = products.stream().anyMatch(p -> Boolean.TRUE.equals(p.getHasCopperPep()));

        List<String> conflicts = new ArrayList<>();
        if (hasRetinol && hasAcid)      conflicts.add("레티놀 + AHA/BHA (자극 및 피부 장벽 손상 위험)");
        if (hasRetinol && hasPureVitC)  conflicts.add("레티놀 + 순수 비타민C (산화 반응으로 효과 감소)");
        if (hasRetinol && hasCopperPep) conflicts.add("레티놀 + 구리 펩타이드 (효과 상쇄)");
        if (hasBenzoyl && hasAcid)      conflicts.add("벤조일퍼옥사이드 + AHA/BHA (과도한 자극)");
        if (hasPureVitC && hasCopperPep) conflicts.add("순수 비타민C + 구리 펩타이드 (성분 불안정)");

        if (!conflicts.isEmpty()) {
            conflictSection.append("[성분 충돌 감지]\n");
            conflicts.forEach(c -> conflictSection.append("- ").append(c).append("\n"));
        }
    }

    // ── 제품 상위 고민 태그 2개 반환
    private String getTopConcernTags(Long productId) {
        List<String> concerns = productConcernCacheRepository.findTopConcernNamesByProductId(productId);
        return concerns.stream().limit(2).collect(Collectors.joining("/"));
    }
}

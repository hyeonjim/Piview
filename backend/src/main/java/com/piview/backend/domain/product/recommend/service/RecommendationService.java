package com.piview.backend.domain.product.recommend.service;

import com.piview.backend.domain.product.catalog.repository.ProductRepository;
import com.piview.backend.domain.product.entity.Category;
import com.piview.backend.domain.product.entity.CategoryIdealScore;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.product.recommend.dto.RecommendMultiRequestDto;
import com.piview.backend.domain.product.recommend.dto.RecommendRequestDto;
import com.piview.backend.domain.product.recommend.dto.RoutineContextDto;
import com.piview.backend.domain.product.recommend.repository.CategoryIdealScoreRepository;
import com.piview.backend.domain.skin.survey.entity.SurveyGender;
import com.piview.backend.domain.user.disliked.entity.MyAvoidContri;
import com.piview.backend.domain.user.disliked.repository.MyAvoidContriRepository;
import com.piview.backend.domain.user.disliked.repository.MyDislikeProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationService {

    private final ProductRepository productRepository;
    private final CategoryIdealScoreRepository idealScoreRepository;
    private final RoutineConflictChecker conflictChecker; // 성분 충돌 필터기
    private final MyDislikeProductRepository dislikeProductRepository;
    private final MyAvoidContriRepository avoidContriRepository;

    // 핵심 매핑: 프론트가 요청한 스텝(1~7)을 실제 DB 소카테고리 ID 리스트로 변환
    private static final Map<Long, List<Long>> ROUTINE_COL_TO_CATEGORIES = Map.of(
            1L, List.of(8L, 9L, 10L, 11L, 12L, 13L), // 클렌저 (폼, 젤, 밤, 오일, 워터, 로션)
            2L, List.of(22L),                       // 쉐이빙
            3L, List.of(1L, 5L, 7L, 16L),                 // 스킨/토너/미스트/패드
            4L, List.of(3L, 21L),                         // 세럼/에센스/앰플
            5L, List.of(2L, 17L, 19L),                         // 로션/에멀전/올인원
            6L, List.of(4L, 6L, 18L),                     // 크림/페이스오일
            7L, List.of(14L, 15L, 20L)                         // 선크림,선스틱
    );

    public List<Product> getRecommendations(Long userId, RecommendRequestDto req, RoutineContextDto routineContext) {

        // 프론트에서 넘어온 타겟 스텝 ID (예: 3번 토너 스텝 추천해줘!)
        Long targetRoutineColId = req.getTargetRoutineColId();

        // 1. 매핑된 소카테고리 ID 리스트 획득 (예: [1, 5, 7])
        List<Long> targetCategoryIds = ROUTINE_COL_TO_CATEGORIES.get(targetRoutineColId);

        if (targetCategoryIds == null || targetCategoryIds.isEmpty()) {
            throw new IllegalArgumentException("해당 스킨케어 단계에 매핑된 카테고리가 없습니다.");
        }

        // 2. 사용자가 등록한 '안 맞는 제품' 및 '피해야 할 성분' 가져오기
        List<Long> dislikedProductIds = dislikeProductRepository.findProductIdsByUserId(userId);
        if (dislikedProductIds.isEmpty()) dislikedProductIds = List.of(-1L);

        List<Long> avoidIngredientIds = avoidContriRepository.findAllByUserIdWithIngredient(userId)
                .stream()
                .map(mac -> mac.getIngredient().getIngredientId())
                .collect(Collectors.toList());
        if (avoidIngredientIds.isEmpty()) avoidIngredientIds = List.of(-1L);

        List<Product> finalRecommendations = new ArrayList<>();

        //공동 계산 : 타겟 루틴의 이상치와 M/O 보정 값은 한 번만 계산하면 됨
        // ====================================================================
        // [분기 A] 루틴이 비어있거나, 씻어내는 '클렌저(1번), 쉐이빙(2번)' 스텝일 경우
        // ====================================================================
        // 워시오프는 얼굴에 남지 않으므로 루틴 누적 오차(Gap) 계산에서 제외합니다.
        boolean isInitial = routineContext.isEmpty() || targetRoutineColId == 1L || targetRoutineColId == 2L;
        double finalTargetM = 0.0;
        double finalTargetO = 0.0;

        if (!isInitial) {
            // ====================================================================
            // [분기 B] 루틴에 제품이 있을 경우 (루틴 밸런스 + 상극 성분 필터링)
            // ====================================================================

            // 3. 해당 스텝 + 피부타입의 이상치(Ideal M/O)를 DB에서 가져옵니다.
            CategoryIdealScore idealScore = idealScoreRepository.findBySkinTypeAndRoutineColId(
                req.getSkinType(), targetRoutineColId
            );
            if(idealScore != null){
                finalTargetM = Math.max(0.0, idealScore.getIdealM().doubleValue() + routineContext.getCurrentDeficitM());
                finalTargetO = Math.max(0.0, idealScore.getIdealO().doubleValue() + routineContext.getCurrentDeficitO());
            }
        }

        for(Long categoryId : targetCategoryIds){
            List<Long> singleCategoryIdList = List.of(categoryId);
            List<Product> candidates;

            if (isInitial){

                candidates = productRepository.findInitialRecommendations(
                    singleCategoryIdList, req.getSkinType(), req.getGender(), req.getConcernId(),
                        dislikedProductIds, avoidIngredientIds
                    );
            } else {
                candidates = productRepository.findRoutineCandidates(
                    singleCategoryIdList, req.getSkinType(), req.getGender(), req.getConcernId(),
                    finalTargetM, finalTargetO, routineContext.getCurrentRoutineIds(),
                        dislikedProductIds, avoidIngredientIds
                );
            }

            List<Product> top5ForCategory = candidates.stream()
                .filter(product -> conflictChecker.calculateConflictPenalty(routineContext, product) == 0.0)
                .limit(5)
                .toList();

            finalRecommendations.addAll(top5ForCategory);
        }

        return finalRecommendations;

    }

    /**
     * 루틴 스텝별로 가장 최적의 제품 1개씩만 추천하는 신규 로직
     * (남성의 경우 5번 스텝이면 올인원(19번) 우선 추천)
     */
    public List<Product> getMultiRecommendations(Long userId, RecommendMultiRequestDto req, RoutineContextDto routineContext) {

        List<Long> targetRoutineColIds = req.getTargetRoutineColIds();
        if (targetRoutineColIds == null || targetRoutineColIds.isEmpty()) {
            return new ArrayList<>();
        }

        // 공통: 사용자가 등록한 '안 맞는 제품' 및 '피해야 할 성분' 가져오기
        List<Long> dislikedProductIds = dislikeProductRepository.findProductIdsByUserId(userId);
        if (dislikedProductIds.isEmpty()) dislikedProductIds = List.of(-1L);

        List<Long> avoidIngredientIds = avoidContriRepository.findAllByUserIdWithIngredient(userId)
                .stream()
                .map(mac -> mac.getIngredient().getIngredientId())
                .collect(Collectors.toList());
        if (avoidIngredientIds.isEmpty()) avoidIngredientIds = List.of(-1L);

        List<Product> finalRecommendations = new ArrayList<>();

        for (Long targetRoutineColId : targetRoutineColIds) {
            List<Long> targetCategoryIds = ROUTINE_COL_TO_CATEGORIES.get(targetRoutineColId);
            if (targetCategoryIds == null || targetCategoryIds.isEmpty()) continue;

            // [추가 조건] 남성 유저가 5번(로션/에멀전/올인원) 스텝을 요청하면, 올인원(19)을 최우선으로 고려
            // targetCategoryIds 리스트의 맨 앞으로 19번을 보냅니다 (order by score 시 동점이면 category_id 순 등으로 제어할 순 없으니 Java에서 처리)
            List<Long> processedCategoryIds = new ArrayList<>(targetCategoryIds);
            boolean isMaleStep5 = (req.getGender() == SurveyGender.MEN && targetRoutineColId == 5L);

            boolean isInitial = routineContext.isEmpty() || targetRoutineColId == 1L || targetRoutineColId == 2L;
            double finalTargetM = 0.0;
            double finalTargetO = 0.0;

            if (!isInitial) {
                CategoryIdealScore idealScore = idealScoreRepository.findBySkinTypeAndRoutineColId(
                        req.getSkinType(), targetRoutineColId
                );
                if (idealScore != null) {
                    finalTargetM = Math.max(0.0, idealScore.getIdealM().doubleValue() + routineContext.getCurrentDeficitM());
                    finalTargetO = Math.max(0.0, idealScore.getIdealO().doubleValue() + routineContext.getCurrentDeficitO());
                }
            }

            // 모든 관련 카테고리 후보를 한꺼번에 조회 (limit 50)
            List<Product> candidates;
            if (isInitial) {
                candidates = productRepository.findInitialRecommendations(
                        processedCategoryIds, req.getSkinType(), req.getGender(), req.getConcernId(),
                        dislikedProductIds, avoidIngredientIds
                );
            } else {
                candidates = productRepository.findRoutineCandidates(
                        processedCategoryIds, req.getSkinType(), req.getGender(), req.getConcernId(),
                        finalTargetM, finalTargetO, routineContext.getCurrentRoutineIds(),
                        dislikedProductIds, avoidIngredientIds
                );
            }

            // [남성 5번 특화] category_id가 19인 제품이 있다면 최상단으로 정렬 유도
            if (isMaleStep5) {
                candidates.sort((p1, p2) -> {
                    boolean p1IsAllInOne = p1.getCategory().getCategoryId() == 19L;
                    boolean p2IsAllInOne = p2.getCategory().getCategoryId() == 19L;
                    if (p1IsAllInOne && !p2IsAllInOne) return -1;
                    if (!p1IsAllInOne && p2IsAllInOne) return 1;
                    return 0; // 기존 순서(점수 순) 유지
                });
            }

            // 성분 충돌 필터 후 가장 점수 높은 1개만 선택
            candidates.stream()
                    .filter(product -> conflictChecker.calculateConflictPenalty(routineContext, product) == 0.0)
                    .findFirst()
                    .ifPresent(finalRecommendations::add);
        }

        return finalRecommendations;
    }
}

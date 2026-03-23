package com.piview.backend.domain.product.recommend.service;

import com.piview.backend.domain.product.catalog.repository.ProductRepository;
import com.piview.backend.domain.product.entity.CategoryIdealScore;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.product.recommend.dto.RecommendRequestDto;
import com.piview.backend.domain.product.recommend.dto.RoutineContextDto;
import com.piview.backend.domain.product.recommend.repository.CategoryIdealScoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public List<Product> getRecommendations(RecommendRequestDto req, RoutineContextDto routineContext) {

        // 프론트에서 넘어온 타겟 스텝 ID (예: 3번 토너 스텝 추천해줘!)
        Long targetRoutineColId = req.getTargetRoutineColId();

        // 1. 매핑된 소카테고리 ID 리스트 획득 (예: [1, 5, 7])
        List<Long> targetCategoryIds = ROUTINE_COL_TO_CATEGORIES.get(targetRoutineColId);

        if (targetCategoryIds == null || targetCategoryIds.isEmpty()) {
            throw new IllegalArgumentException("해당 스킨케어 단계에 매핑된 카테고리가 없습니다.");
        }

        // ====================================================================
        // [분기 A] 루틴이 비어있거나, 씻어내는 '클렌저(1번), 쉐이빙(2번)' 스텝일 경우
        // ====================================================================
        // 워시오프는 얼굴에 남지 않으므로 루틴 누적 오차(Gap) 계산에서 제외합니다.
        if (routineContext.isEmpty() || targetRoutineColId == 1L || targetRoutineColId == 2L) {

            // DB에서 1차 50개 추출 (Gap 보정 없음)
            List<Product> initialCandidates = productRepository.findInitialRecommendations(
                    targetCategoryIds, req.getSkinType(), req.getGender(), req.getConcernId()
            );

            // 메모리 단에서 성분 충돌 필터링 후 Top 10 반환
            return filterAndLimit(initialCandidates, routineContext);
        }

        // ====================================================================
        // [분기 B] 루틴에 제품이 있을 경우 (루틴 밸런스 + 상극 성분 필터링)
        // ====================================================================

        // 2. 해당 스텝 + 피부타입의 이상치(Ideal M/O)를 DB에서 가져옵니다.
        CategoryIdealScore idealScore = idealScoreRepository.findBySkinTypeAndRoutineColId(
                req.getSkinType(), targetRoutineColId
        );

        if (idealScore == null) {
            log.warn("해당 피부타입({})과 스텝({})에 대한 이상치 데이터가 없습니다.", req.getSkinType(), targetRoutineColId);
            // 이상치가 없으면 분기 A 로직으로 폴백(Fallback) 처리
            List<Product> initialCandidates = productRepository.findInitialRecommendations(
                targetCategoryIds, req.getSkinType(), req.getGender(), req.getConcernId()
            );
            return filterAndLimit(initialCandidates, routineContext);
        }

        // 3. 최종 타겟 M, O 설정 = (스텝 기본 이상치) + (지금까지 누적된 오차 짬처리)
        double finalTargetM = Math.max(0.0, idealScore.getIdealM().doubleValue() + routineContext.getCurrentDeficitM());
        double finalTargetO = Math.max(0.0, idealScore.getIdealO().doubleValue() + routineContext.getCurrentDeficitO());

        // 4. DB에 갭 보정 점수가 반영된 '상위 50개 후보군(Retrieval)' 요청
        List<Product> routineCandidates = productRepository.findRoutineCandidates(
                targetCategoryIds,
                req.getSkinType(),
                req.getGender(),
                req.getConcernId(),
                finalTargetM,
                finalTargetO,
                routineContext.getCurrentRoutineIds() // 장바구니에 있는 제품 ID 넘겨서 중복 방지
        );

        // 5. 메모리 단에서 성분 충돌 필터링 후 Top 10 반환
        return filterAndLimit(routineCandidates, routineContext);
    }

    /**
     * 후보군 50개를 순회하며 상극 성분이 있는 제품을 완전히 버리고, 깨끗한 상위 10개만 반환하는 헬퍼 메서드
     */
    private List<Product> filterAndLimit(List<Product> candidates, RoutineContextDto routineContext) {
        return candidates.stream()
                // penalty가 0.0이면 충돌 없음(안전), 마이너스면 충돌 발생(버림)
                .filter(product -> conflictChecker.calculateConflictPenalty(routineContext, product) == 0.0)
                .limit(10) // 최종 10개만 프론트엔드에 전달
                .collect(Collectors.toList());
    }
}

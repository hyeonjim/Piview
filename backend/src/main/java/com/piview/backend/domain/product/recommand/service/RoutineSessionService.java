package com.piview.backend.domain.product.recommand.service;

import com.piview.backend.domain.product.catalog.repository.ProductRepository;
import com.piview.backend.domain.product.entity.CategoryIdealScore;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.product.recommand.dto.RoutineContextDto;
import com.piview.backend.domain.product.recommand.repository.CategoryIdealScoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoutineSessionService {

    private final ProductRepository productRepository;
    private final CategoryIdealScoreRepository idealScoreRepository;

    // ★ 역방향 매핑: DB의 소카테고리 ID -> 루틴 스텝(routine_col_id)으로 그룹화하기 위함
    private static final Map<Long, Long> CATEGORY_TO_ROUTINE_COL = new HashMap<>();
    static {
        // 클렌저 (1번 스텝)
        List.of(8L, 9L, 10L, 11L, 12L, 13L).forEach(id -> CATEGORY_TO_ROUTINE_COL.put(id, 1L));
        // 스킨/토너/미스트/패드 (3번 스텝)
        List.of(1L, 5L, 7L).forEach(id -> CATEGORY_TO_ROUTINE_COL.put(id, 3L));
        // 세럼/에센스/앰플 (4번 스텝)
        CATEGORY_TO_ROUTINE_COL.put(3L, 4L);
        // 로션/에멀전/올인원 (5번 스텝)
        CATEGORY_TO_ROUTINE_COL.put(2L, 5L);
        // 크림/페이스오일 (6번 스텝)
        List.of(4L, 6L).forEach(id -> CATEGORY_TO_ROUTINE_COL.put(id, 6L));
        // 선크림 (7번 스텝)
        CATEGORY_TO_ROUTINE_COL.put(14L, 7L);
    }

    /**
     * Redis에서 가져온 장바구니 제품 ID 목록을 바탕으로 현재 유수분 오차 및 상극 성분을 계산합니다.
     */
    public RoutineContextDto buildRoutineContext(List<Long> currentRoutineProductIds, String skinType) {
        RoutineContextDto context = new RoutineContextDto();
        context.setCurrentRoutineIds(currentRoutineProductIds); // 현재 담긴 ID 목록 세팅

        // 1. 장바구니가 비어있다면 빈 상태로 반환
        if (currentRoutineProductIds == null || currentRoutineProductIds.isEmpty()) {
            context.setEmpty(true);
            return context;
        }

        context.setEmpty(false);
        // DB에서 현재 장바구니에 담긴 제품들의 모든 정보를 조회
        List<Product> routineProducts = productRepository.findAllById(currentRoutineProductIds);

        // ==========================================
        // [A] 성분 충돌(Clash) 8대 플래그 누적 (OR 연산)
        // ==========================================
        for (Product p : routineProducts) {
            if (Boolean.TRUE.equals(p.getHasRetinol())) context.setHasRetinol(true);
            if (Boolean.TRUE.equals(p.getHasAcid())) context.setHasAcid(true);
            if (Boolean.TRUE.equals(p.getHasPureVitC())) context.setHasPureVitC(true);
            if (Boolean.TRUE.equals(p.getHasCopperPep())) context.setHasCopperPep(true);
            if (Boolean.TRUE.equals(p.getHasNiacinamide())) context.setHasNiacinamide(true);
            if (Boolean.TRUE.equals(p.getHasBenzoyl())) context.setHasBenzoyl(true);
            if (Boolean.TRUE.equals(p.getHasProtein())) context.setHasProtein(true);
            if (Boolean.TRUE.equals(p.getHasArbutin())) context.setHasArbutin(true);
        }

        // ==========================================
        // [B] 스텝(routine_col_id)별 누적 오차(Deficit) 계산
        // ==========================================
        double totalDeficitM = 0.0;
        double totalDeficitO = 0.0;

        // 담겨있는 제품들을 '소카테고리'가 아닌 '루틴 스텝(1~7)' 기준으로 그룹화합니다.
        Map<Long, List<Product>> productsByRoutineCol = routineProducts.stream()
                .filter(p -> CATEGORY_TO_ROUTINE_COL.containsKey(p.getCategoryId()))
                .collect(Collectors.groupingBy(p -> CATEGORY_TO_ROUTINE_COL.get(p.getCategoryId())));

        for (Map.Entry<Long, List<Product>> entry : productsByRoutineCol.entrySet()) {
            Long routineColId = entry.getKey();
            List<Product> productsInThisStep = entry.getValue();

            // 클렌저(1번 스텝)는 씻어내므로 오차 누적에서 제외
            if (routineColId == 1L) continue;

            // 해당 스텝 + 피부타입의 이상치(Ideal M, O) 조회
            CategoryIdealScore ideal = idealScoreRepository.findBySkinTypeAndRoutineColId(skinType, routineColId);
            if (ideal == null) continue;

            // 유저가 이 스텝에 바른 제품들의 M/O 총합 (예: 토너 + 미스트 수분량 합산)
            double sumM = productsInThisStep.stream()
                    .mapToDouble(p -> p.getMScore() != null ? p.getMScore().doubleValue() : 0.0)
                    .sum();

            double sumO = productsInThisStep.stream()
                    .mapToDouble(p -> p.getOScore() != null ? p.getOScore().doubleValue() : 0.0)
                    .sum();

            // 오차 = (이상치 - 실제 바른 총합)
            totalDeficitM += (ideal.getIdealM().doubleValue() - sumM);
            totalDeficitO += (ideal.getIdealO().doubleValue() - sumO);
        }

        context.setCurrentDeficitM(totalDeficitM);
        context.setCurrentDeficitO(totalDeficitO);

        return context;
    }
}

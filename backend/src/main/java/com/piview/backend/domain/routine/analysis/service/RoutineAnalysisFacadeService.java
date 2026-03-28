package com.piview.backend.domain.routine.analysis.service;

import com.piview.backend.domain.product.catalog.repository.ProductIngredientRepository;
import com.piview.backend.domain.product.entity.CategoryIdealScore;
import com.piview.backend.domain.product.recommend.repository.CategoryIdealScoreRepository;
import com.piview.backend.domain.routine.analysis.dto.response.RoutineAnalysisResponse;
import com.piview.backend.domain.routine.core.entity.MyRoutine;
import com.piview.backend.domain.routine.core.entity.RoutineDetail;
import com.piview.backend.domain.routine.core.repository.RoutineRepository;
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
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoutineAnalysisFacadeService {

    private final UserRepository userRepository;
    private final MySkinRepository mySkinRepository;
    private final RoutineRepository routineRepository;
    private final CategoryIdealScoreRepository categoryIdealScoreRepository;
    private final ProductIngredientRepository productIngredientRepository;
    private final RoutineAnalysisAiClient routineAnalysisAiClient;

    @Transactional(readOnly = true)
    public CompletableFuture<RoutineAnalysisResponse> analyzeMainRoutine(Long userId) {

        // 1. 유저 조회
        User user = userRepository.findByIdAndExistTrue(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 2. 피부 타입(한글) + 고민 조회
        String userSkinType = (user.getMySkinType() != null) ? user.getMySkinType().getKorean() : "알 수 없음";
        List<MySkin> mySkins = mySkinRepository.findAllByUserId(userId);
        String userConcerns = mySkins.isEmpty()
                ? "없음"
                : mySkins.stream().map(MySkin::getSkinProblem).collect(Collectors.joining(", "));

        // 3. 메인 루틴 조회 (details + routineColumn + product 한번에)
        MyRoutine mainRoutine = routineRepository.findByUserIdAndIsMainTrue(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.MAIN_ROUTINE_NOT_FOUND));

        List<RoutineDetail> details = mainRoutine.getDetails();
        if (details.isEmpty()) {
            throw new CustomException(ErrorCode.EMPTY_ROUTINE_DRAFT);
        }

        // 4. 성분 일괄 조회
        List<Long> productIds = details.stream()
                .filter(d -> d.getProduct() != null)
                .map(d -> d.getProduct().getProductId())
                .collect(Collectors.toList());

        Map<Long, String> ingredientMap = productIngredientRepository.findByProductIds(productIds)
                .stream()
                .collect(Collectors.toMap(
                        pi -> pi.getProduct().getProductId(),
                        pi -> pi.getProductIngredientsKo() != null
                                ? pi.getProductIngredientsKo() : "성분 정보 없음"
                ));

        // 5. 이상치 일괄 조회 (N+1 해결)
        List<Long> routineColIds = details.stream()
                .map(d -> d.getRoutineColumn().getId().longValue())
                .distinct()
                .collect(Collectors.toList());

        Map<Long, CategoryIdealScore> idealScoreMap = user.getMySkinType() != null
                ? categoryIdealScoreRepository
                        .findBySkinTypeAndRoutineColIdIn(user.getMySkinType(), routineColIds)
                        .stream()
                        .collect(Collectors.toMap(CategoryIdealScore::getRoutineColId, s -> s))
                : Map.of();

        // 6. 루틴 스텝별 정보 + 이상치 조합
        StringBuilder routineSection = new StringBuilder("[루틴 구성 및 이상치 분석]\n");
        for (RoutineDetail detail : details) {
            if (detail.getProduct() == null) continue;

            Long productId = detail.getProduct().getProductId();
            String productName = detail.getProduct().getName();
            String categoryName = detail.getProduct().getCategory() != null
                    ? detail.getProduct().getCategory().getCategoryName() : "카테고리 없음";
            String columnName = detail.getRoutineColumn().getName();
            Long routineColId = detail.getRoutineColumn().getId().longValue();
            String ingredients = ingredientMap.getOrDefault(productId, "성분 정보 없음");

            String idealInfo = "";
            CategoryIdealScore ideal = idealScoreMap.get(routineColId);
            if (ideal != null) {
                idealInfo = String.format(" | 이상치 수분=%.2f, 유분=%.2f",
                        ideal.getIdealM(), ideal.getIdealO());
            }

            String trimmedIngredients = ingredients.length() > 200
                    ? ingredients.substring(0, 200) + "..." : ingredients;

            routineSection.append(String.format(
                    "- [Step %d] %s (%s / %s)%s\n  성분: %s\n",
                    detail.getStepOrder(), productName, categoryName, columnName,
                    idealInfo, trimmedIngredients
            ));
        }

        // 7. 프롬프트 컨텍스트 조립
        String context = String.format(
                """
                [사용자 피부 정보]
                피부 타입: %s
                피부 고민: %s

                %s
                """,
                userSkinType, userConcerns, routineSection
        );

        // 8. GMS(Gemini) 호출
        return routineAnalysisAiClient.analyzeRoutineAsync(context);
    }
}

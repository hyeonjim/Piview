package com.piview.backend.domain.product.recommend.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.product.recommend.dto.RecommendRequestDto;
import com.piview.backend.domain.product.recommend.dto.RecommendResponseDto;
import com.piview.backend.domain.product.recommend.dto.RoutineContextDto;
import com.piview.backend.domain.product.recommend.service.RecommendationService;
import com.piview.backend.domain.product.recommend.service.RedisRoutineService;
import com.piview.backend.domain.product.recommend.service.RoutineSessionService;
import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@Tag(name = "Recommendation API", description = "피부 맞춤형 화장품 추천 알고리즘 API")
@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RedisRoutineService redisRoutineService;
    private final RoutineSessionService routineSessionService;
    private final RecommendationService recommendationService;

    @PostMapping("/products")
    public ApiResponse<List<RecommendResponseDto>> getRecommendedProducts(
        @AuthenticationPrincipal UserPrincipal userPrincipal,
        @RequestBody RecommendRequestDto request) throws JsonProcessingException {

        // 1. 토큰에서 userId 추출
        Long userId = userPrincipal.getId();

        // 2. Redis에서 유저가 담아둔 제품 ID 목록 싹 가져오기
        List<Long> currentRoutineIds = redisRoutineService.getDraftProductsIds(userId);

        // 3. DB에서 M, O 실시간 누적 계산
        RoutineContextDto routineContext = routineSessionService.buildRoutineContext(
                currentRoutineIds,
                request.getSkinType()
        );

        // 4. 추천 알고리즘
        List<Product> recommendedProducts = recommendationService.getRecommendations(request, routineContext);

        // 5. 프론트엔드용 DTO 변환 후 응답
        List<RecommendResponseDto> responseData = recommendedProducts.stream()
                .map(RecommendResponseDto::from)
                .collect(Collectors.toList());

        return ApiResponse.success(responseData);
    }
}

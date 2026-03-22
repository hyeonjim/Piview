package com.piview.backend.domain.product.recommand.controller;

import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.product.recommand.dto.RecommendRequestDto;
import com.piview.backend.domain.product.recommand.dto.RecommendResponseDto;
import com.piview.backend.domain.product.recommand.dto.RoutineContextDto;
import com.piview.backend.domain.product.recommand.service.RecommendationService;
import com.piview.backend.domain.product.recommand.service.RedisRoutineService;
import com.piview.backend.domain.product.recommand.service.RoutineSessionService;
import com.piview.backend.global.exception.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@Tag(name = "Recommendation API", description = "피부 맞춤형 화장품 추천 알고리즘 API")
@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RedisRoutineService redisRoutineService; // 새로 추가됨!
    private final RoutineSessionService routineSessionService;
    private final RecommendationService recommendationService;

    @PostMapping("/products")
    public ApiResponse<List<RecommendResponseDto>> getRecommendedProducts(
            @RequestHeader("Authorization") String token, // 유저 식별용 (JWT 등)
            @RequestBody RecommendRequestDto request) {

        // 1. 토큰에서 userId 추출 (이 부분은 프로젝트의 Auth 로직에 맞게 구현하시면 됩니다)
        Long userId = extractUserIdFromToken(token);

        // 2. Redis에서 유저가 담아둔 제품 ID 목록 싹 가져오기
        List<Long> currentRoutineIds = redisRoutineService.getDraftProductIds(userId);

        // 3. 기존에 잘 짜둔 코드 그대로 재활용! (DB에서 M, O 실시간 누적 계산)
        RoutineContextDto routineContext = routineSessionService.buildRoutineContext(
                currentRoutineIds,
                request.getSkinType()
        );

        // 4. 추천 알고리즘 뇌 풀가동
        List<Product> recommendedProducts = recommendationService.getRecommendations(request, routineContext);

        // 5. 프론트엔드용 DTO 변환 후 응답
        List<RecommendResponseDto> responseData = recommendedProducts.stream()
                .map(RecommendResponseDto::from)
                .collect(Collectors.toList());

        return ApiResponse.success(responseData);
    }

    // (임시 헬퍼 메서드 - 실제 시큐리티 로직으로 대체하세요)
    private Long extractUserIdFromToken(String token) {
        return 1L;
    }
}

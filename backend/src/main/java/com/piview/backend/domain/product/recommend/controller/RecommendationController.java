package com.piview.backend.domain.product.recommend.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.piview.backend.domain.product.catalog.repository.ProductConcernCacheRepository;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.product.like.repository.ProductLikeRepository;
import com.piview.backend.domain.product.recommend.dto.RecommendMultiRequestDto;
import com.piview.backend.domain.product.recommend.dto.RecommendRequestDto;
import com.piview.backend.domain.product.recommend.dto.RecommendResponseDto;
import com.piview.backend.domain.product.recommend.dto.RoutineContextDto;
import com.piview.backend.domain.product.recommend.service.RecommendationService;
import com.piview.backend.domain.product.recommend.service.RedisRoutineService;
import com.piview.backend.domain.product.recommend.service.RoutineSessionService;
import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@Tag(name = "Recommendation API", description = "피부 맞춤형 화장품 추천 알고리즘 API")
@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RedisRoutineService redisRoutineService;
    private final RoutineSessionService routineSessionService;
    private final RecommendationService recommendationService;
    private final ProductLikeRepository productLikeRepository;
    private final ProductConcernCacheRepository productConcernCacheRepository;

    @PostMapping("/products")
    public ApiResponse<Map<String,List<RecommendResponseDto>>> getRecommendedProducts(
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
        List<Product> recommendedProducts = recommendationService.getRecommendations(userId, request, routineContext);

        // 5. 프론트엔드용 DTO 변환 후 응답
        List<Long> recommendedProductIds = recommendedProducts.stream()
                .map(Product::getProductId)
                .collect(Collectors.toList());

        //6. 해당 10개 중 유저가 좋아요한 제품 ID만 Set으로 가져옴
        Set<Long> likedProductIds = productLikeRepository.findLikedProductIds(userId, recommendedProductIds);

        // 7. 제품별 태그(고민) 정보 조회
        List<ProductConcernCacheRepository.ConcernView> concernViews = productConcernCacheRepository.findConcernViewsByProductIds(recommendedProductIds);
        Map<Long, List<String>> productConcernsMap = concernViews.stream()
            .collect(Collectors.groupingBy(
                ProductConcernCacheRepository.ConcernView::getProductId,
                Collectors.mapping(ProductConcernCacheRepository.ConcernView::getConcernName, Collectors.toList())
            ));

        // 8. dto 변환 시, Set에 포함되어 있으면 true, 아니면 false를 전달
        Map<String, List<RecommendResponseDto>> groupedResponse = recommendedProducts.stream()
            .map(product -> RecommendResponseDto.from(
                product,
                likedProductIds.contains(product.getProductId()),
                request.getConcernId(),
                productConcernsMap.getOrDefault(product.getProductId(), List.of())
            ))
            .collect(Collectors.groupingBy(
                RecommendResponseDto::getCategoryName,
                LinkedHashMap::new, //순서 유지
                Collectors.toList()
            ));
        return ApiResponse.success(groupedResponse);

    }

    /**
     * 루틴 스텝별로 가장 적합한 제품 1개씩만 추천하는 API
     */
    @PostMapping("/products/multi")
    public ApiResponse<Map<String, List<RecommendResponseDto>>> getMultiRecommendedProducts(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody RecommendMultiRequestDto request) throws JsonProcessingException {

        Long userId = userPrincipal.getId();
        List<Long> currentRoutineIds = redisRoutineService.getDraftProductsIds(userId);

        // 루틴 컨텍스트 빌드
        RoutineContextDto routineContext = routineSessionService.buildRoutineContext(
                currentRoutineIds,
                request.getSkinType()
        );

        // 스텝별 최적 1개 제품 추천 로직 호출
        List<Product> recommendedProducts = recommendationService.getMultiRecommendations(userId, request, routineContext);

        List<Long> recommendedProductIds = recommendedProducts.stream()
                .map(Product::getProductId)
                .collect(Collectors.toList());

        Set<Long> likedProductIds = productLikeRepository.findLikedProductIds(userId, recommendedProductIds);

        List<ProductConcernCacheRepository.ConcernView> concernViews = productConcernCacheRepository.findConcernViewsByProductIds(recommendedProductIds);
        Map<Long, List<String>> productConcernsMap = concernViews.stream()
                .collect(Collectors.groupingBy(
                        ProductConcernCacheRepository.ConcernView::getProductId,
                        Collectors.mapping(ProductConcernCacheRepository.ConcernView::getConcernName, Collectors.toList())
                ));

        Map<String, List<RecommendResponseDto>> groupedResponse = recommendedProducts.stream()
                .map(product -> RecommendResponseDto.from(
                        product,
                        likedProductIds.contains(product.getProductId()),
                        request.getConcernId(),
                        productConcernsMap.getOrDefault(product.getProductId(), List.of())
                ))
                .collect(Collectors.groupingBy(
                        RecommendResponseDto::getCategoryName,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        return ApiResponse.success(groupedResponse);
    }
}

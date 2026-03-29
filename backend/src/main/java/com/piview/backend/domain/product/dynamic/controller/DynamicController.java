package com.piview.backend.domain.product.dynamic.controller;

import com.piview.backend.domain.product.catalog.dto.ProductPageResponse;
import com.piview.backend.domain.product.dynamic.service.ProductRecommendationService;
import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "동적 추천 API", description = "제품 클릭, 검색, 좋아요를 반영한 사용자 맞춤형 제품 추천 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/dynamic")
public class DynamicController {

  private final ProductRecommendationService recommendationService;

  @Operation(summary = "사용자 맞춤 상품 전체 조회", description = "사용자 맞춤형 제품을 카테고리별로 페이징 조회합니다.")
  @GetMapping("/recommendations")
  public ApiResponse<ProductPageResponse> getRecommendations(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestParam(required = false) Integer bigCategoryId,
      @RequestParam(required = false) Long categoryId,
      @Parameter(description = "페이지 번호(0부터 시작)", example = "0")
      @RequestParam(required = false, defaultValue = "0") int page,
      @Parameter(description = "페이지 크기(최대 50)", example = "10")
      @RequestParam(required = false, defaultValue = "10") int size) {

    // 추천 목록도 page/size를 외부에서 받되, 한 번에 너무 큰 페이지는 방어한다.
    size = Math.min(size, 50);

    PageRequest pageRequest = PageRequest.of(page, size);
    ProductPageResponse response =
        recommendationService.getRecommendedProducts(
            userPrincipal.getId(), bigCategoryId, categoryId, pageRequest);

    return ApiResponse.success(response);
  }
}

package com.piview.backend.domain.product.aisummary.controller;

import com.piview.backend.domain.product.aisummary.dto.AiComparisonResponse;
import com.piview.backend.domain.product.aisummary.dto.ProductLine12SummaryResponse;
import com.piview.backend.domain.product.aisummary.service.AiCompareFacadeService;
import com.piview.backend.domain.product.aisummary.service.ProductSummaryFacadeService;
import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "AI 요약 및 추천 API", description = "피뷰(FiView) AI 3줄 요약 및 비교 분석 맞춤형 메시지 API")
@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class AiSummaryController {

  private final ProductSummaryFacadeService productSummaryFacadeService;
  private final AiCompareFacadeService aiCompareFacadeService;

  @Operation(
      summary = "AI 화장품 3줄 요약",
      description = "사용자의 피부 타입, 고민 및 화장품의 성분/태그를 기반으로 맞춤형 3줄 요약(궁합, 효능, 주의사항/팁)을 제공합니다."
  )
  @GetMapping("/{productId}/summary")
  public CompletableFuture<ApiResponse<ProductLine12SummaryResponse>> getProductSummary(
      @PathVariable Long productId,
      @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal
  ) {

    Long userId = userPrincipal.getId();
    // LLM 비동기 작업 + DB 추천 로직이 융합된 결과를 프론트엔드에 반환
    return productSummaryFacadeService.getPersonalizedSummary(userId, productId)
        .thenApply(response -> ApiResponse.success("AI 제품 요약을 성공적으로 불러왔습니다.", response));
  }

  @Operation(
      summary = "AI 제품 비교 분석 요약",
      description = "두 개의 화장품 ID를 받아, 사용자의 피부 정보와 각 제품의 특징을 비교 분석하여 어떤 제품이 더 적합한지 줄글 형태로 추천해 줍니다. (프론트엔드 비동기 로딩 권장)"
  )
  @GetMapping("/compare/ai-summary")
  public CompletableFuture<ApiResponse<AiComparisonResponse>> getAiComparisonSummary(
      @RequestParam List<Long> productIds,
      @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal
  ) {
    Long userId = userPrincipal.getId();

    // 논블로킹(Non-blocking)으로 AI 응답을 기다렸다가 반환
    return aiCompareFacadeService.getAiComparisonSummary(userId, productIds)
        .thenApply(response -> ApiResponse.success("AI 비교 분석을 성공적으로 불러왔습니다.", response));
  }
}

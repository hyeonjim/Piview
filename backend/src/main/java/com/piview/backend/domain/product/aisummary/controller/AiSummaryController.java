package com.piview.backend.domain.product.aisummary.controller;

import com.piview.backend.domain.product.aisummary.dto.ProductLine12SummaryResponse;
import com.piview.backend.domain.product.aisummary.service.ProductSummaryFacadeService;
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

@Tag(name = "AI 요약 및 추천 API", description = "피뷰(FiView) 화장품 상세 페이지의 AI 3줄 요약 및 맞춤형 추천 메시지 API")
@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class AiSummaryController {

  private final ProductSummaryFacadeService productSummaryFacadeService;

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
}

package com.piview.backend.domain.product.aisummary.controller;

import com.piview.backend.domain.product.aisummary.dto.ProductLine12SummaryResponse;
import com.piview.backend.domain.product.aisummary.service.ProductSummaryFacadeService;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class AiSummaryController {

  private final ProductSummaryFacadeService productSummaryFacadeService;

  @GetMapping("/{productId}/summary")
  public CompletableFuture<ProductLine12SummaryResponse> getProductSummary(
      @PathVariable Long productId,
      @RequestParam Long userId
  ) {
    // LLM 비동기 작업 + DB 추천 로직이 융합된 결과를 프론트엔드에 반환
    return productSummaryFacadeService.getPersonalizedSummary(userId, productId);
  }
}

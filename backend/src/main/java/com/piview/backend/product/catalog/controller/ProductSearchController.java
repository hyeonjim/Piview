package com.piview.backend.product.catalog.controller;

import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.product.catalog.dto.ProductSearchPageResponseDto;
import com.piview.backend.product.catalog.service.ProductSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/products")
public class ProductSearchController {
  private final ProductSearchService productSearchService;

  @GetMapping("/search")
  public ResponseEntity<ProductSearchPageResponseDto> searchProducts(
      @RequestParam("keyword") String keyword,
      @RequestParam(value = "page", defaultValue = "0") int page,
      @AuthenticationPrincipal UserPrincipal userPrincipal) {

    Long userId = (userPrincipal != null) ? userPrincipal.getId() : null;

    // 페이지 번호와 함께 10개씩 가져오도록 사이즈 고정
    PageRequest pageRequest = PageRequest.of(page, 10);

    ProductSearchPageResponseDto response = productSearchService.searchProducts(keyword, pageRequest, userId);

    return ResponseEntity.ok(response);
  }
}

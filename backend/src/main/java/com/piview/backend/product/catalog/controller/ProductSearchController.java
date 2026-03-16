package com.piview.backend.product.catalog.controller;


import com.piview.backend.product.catalog.dto.ProductPageResponse;
import com.piview.backend.product.catalog.dto.ProductSearchCondition;
import com.piview.backend.product.catalog.service.ProductCatalogService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/products")
public class ProductSearchController {

  private final ProductCatalogService productCatalogService;

  @Deprecated(forRemoval = false)
  @GetMapping("/search")
  public ResponseEntity<ProductPageResponse> searchProducts(
      @RequestParam("keyword") String keyword,
      @RequestParam(value = "page", defaultValue = "0") int page) {

    ProductSearchCondition condition = ProductSearchCondition.builder()
            .q(keyword)
            .page(page)
            .size(10)
            .build();

    ProductPageResponse response = productCatalogService.searchProducts(condition);
    return ResponseEntity.ok(response);
  }
}

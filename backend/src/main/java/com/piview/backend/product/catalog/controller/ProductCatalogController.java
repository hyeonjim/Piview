package com.piview.backend.product.catalog.controller;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.product.catalog.dto.ProductPageResponse;
import com.piview.backend.product.catalog.dto.ProductSearchCondition;
import com.piview.backend.product.catalog.service.ProductCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductCatalogController {

    private final ProductCatalogService productCatalogService;

    @GetMapping
    public ApiResponse<ProductPageResponse> searchProducts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer bigCategoryId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String skinType,
            @RequestParam(required = false) List<Long> tagIds,
            @RequestParam(required = false) List<Long> brandIds,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false, defaultValue = "0")  int page,
            @RequestParam(required = false, defaultValue = "10") int size, Principal principal) {

        size = Math.min(size, 50);  // 최대 50개 방어 처리

        ProductSearchCondition condition = ProductSearchCondition.builder()
                .q(q)
                .bigCategoryId(bigCategoryId)
                .categoryId(categoryId)
                .skinType(skinType)
                .tagIds(tagIds)
                .brandIds(brandIds)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .page(page)
                .size(size)
                .build();

        ProductPageResponse result = productCatalogService.searchProducts(condition);

        return ApiResponse.success(result);
    }
}
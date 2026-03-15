package com.piview.backend.product.controller;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.product.dto.ProductPageResponse;
import com.piview.backend.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /**
     * 제품 목록 조회 (동적 필터 + 페이지네이션)
     *
     * GET /api/products?page=0&size=10
     * GET /api/products?bigCategoryId=1&page=0&size=10
     * GET /api/products?bigCategoryId=1&categoryId=3&page=0&size=10
     * GET /api/products?name=선크림&skinType=dry&page=1&size=10
     * GET /api/products?tagIds=1,2,3&page=0&size=10
     */
    @GetMapping
    public ApiResponse<ProductPageResponse> searchProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer bigCategoryId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String skinType,
            @RequestParam(required = false) List<Long> tagIds,
            @RequestParam(required = false, defaultValue = "0")  int page,
            @RequestParam(required = false, defaultValue = "10") int size) {

        size = Math.min(size, 50);  // 최대 50개 방어 처리

        ProductPageResponse result = productService.searchProducts(
                name, brand, categoryId, bigCategoryId, skinType, tagIds, page, size);

        return ApiResponse.success(result);
    }
}
package com.piview.backend.product.catalog.controller;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.product.catalog.dto.ProductDetailResponse;
import com.piview.backend.product.catalog.dto.ProductFilterMetaResponse;
import com.piview.backend.product.catalog.dto.ProductPageResponse;
import com.piview.backend.product.catalog.dto.ProductSearchCondition;
import com.piview.backend.product.catalog.service.ProductCatalogService;
import com.piview.backend.product.entity.SkinTypeEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
            @RequestParam(required = false, defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        size = Math.min(size, 50);  // 최대 50개 방어 처리

        ProductSearchCondition condition = ProductSearchCondition.builder()
                .q(q)
                .bigCategoryId(bigCategoryId)
                .categoryId(categoryId)
                .skinType(parseSkinType(skinType))
                .tagIds(tagIds)
                .brandIds(brandIds)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .page(page)
                .size(size)
                .build();

        Long userId = (userPrincipal != null) ? userPrincipal.getId() : null;
        ProductPageResponse result = productCatalogService.searchProducts(condition, userId);

        return ApiResponse.success(result);
    }

    private SkinTypeEnum parseSkinType(String skinType) {
        if (skinType == null || skinType.isBlank() || "전체".equals(skinType)) {
            return null;
        }
        try {
            return SkinTypeEnum.valueOf(skinType.trim().toLowerCase());
        } catch (IllegalArgumentException e) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
    }

    @GetMapping("/{productId}")
    public ApiResponse<ProductDetailResponse> productDetail(@PathVariable Long productId,
        @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long userId = (userPrincipal != null) ? userPrincipal.getId() : null;
        ProductDetailResponse result = productCatalogService.getProductDetail(productId, userId);
        return ApiResponse.success(result);
    }

    @GetMapping("/filters")
    public ApiResponse<ProductFilterMetaResponse> getProductFilters() {
        return ApiResponse.success(productCatalogService.getFilterMeta());
    }
}
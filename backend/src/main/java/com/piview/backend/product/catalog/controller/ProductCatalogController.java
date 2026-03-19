package com.piview.backend.product.catalog.controller;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.product.catalog.dto.ProductDetailResponse;
import com.piview.backend.product.catalog.dto.ProductFilterMetaResponse;
import com.piview.backend.product.catalog.dto.ProductPageResponse;
import com.piview.backend.product.catalog.dto.ProductSearchCondition;
import com.piview.backend.product.catalog.service.ProductCatalogService;
import com.piview.backend.product.entity.SkinTypeEnum;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "상품 카탈로그 API", description = "상품 검색, 상세 조회, 필터 메타 조회 API입니다.")
@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductCatalogController {

    private final ProductCatalogService productCatalogService;

    @Operation(summary = "상품 목록 검색", description = "검색어, 카테고리, 피부 타입, 태그, 브랜드, 가격 범위 등 조건으로 페이징 조회합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 파라미터 (예: skinType 값 오류)", content = @Content(schema = @Schema(hidden = true))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요", content = @Content(schema = @Schema(hidden = true))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content(schema = @Schema(hidden = true)))
    })
    @GetMapping
    public ApiResponse<ProductPageResponse> searchProducts(
            @Parameter(description = "검색어", example = "독도") @RequestParam(required = false) String q,
            @Parameter(description = "대카테고리 ID", example = "1") @RequestParam(required = false) Integer bigCategoryId,
            @Parameter(description = "카테고리 ID", example = "10") @RequestParam(required = false) Long categoryId,
            @Parameter(description = "피부타입(dry, oily, combination, subuji)", example = "독도") @RequestParam(required = false) String skinType,
            @Parameter(description = "태그 ID 목록", example = "1, 2, 3") @RequestParam(required = false) List<Long> tagIds,
            @Parameter(description = "브랜드 ID 목록", example = "4, 5") @RequestParam(required = false) List<Long> brandIds,
            @Parameter(description = "최소 가격", example = "10000") @RequestParam(required = false) Integer minPrice,
            @Parameter(description = "최대 가격", example = "30000") @RequestParam(required = false) Integer maxPrice,
            @Parameter(description = "페이지 번호(0부터 시작)", example = "0") @RequestParam(required = false, defaultValue = "0")  int page,
            @Parameter(description = "페이지 크기(최대 50)", example = "10") @RequestParam(required = false, defaultValue = "10") int size,
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

    @Operation(summary = "상품 상세 조회", description = "상품 ID로 특정 상품의 상세 정보를 조회합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "해당 상품 없음 (COSMETICS_NOT_FOUND)", content = @Content(schema = @Schema(hidden = true))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요", content = @Content(schema = @Schema(hidden = true)))
    })
    @GetMapping("/{productId}")
    public ApiResponse<ProductDetailResponse> productDetail(@PathVariable Long productId,
        @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long userId = (userPrincipal != null) ? userPrincipal.getId() : null;
        ProductDetailResponse result = productCatalogService.getProductDetail(productId, userId);
        return ApiResponse.success(result);
    }

    @Operation(summary = "상품 필터 메타 조회", description = "대카테고리, 카테고리, 브랜드, 태그 등 필터링에 필요한 메타 데이터를 반환합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요", content = @Content(schema = @Schema(hidden = true)))
    })
    @GetMapping("/filters")
    public ApiResponse<ProductFilterMetaResponse> getProductFilters() {
        return ApiResponse.success(productCatalogService.getFilterMeta());
    }
}
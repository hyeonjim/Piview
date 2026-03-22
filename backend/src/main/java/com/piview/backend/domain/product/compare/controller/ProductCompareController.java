package com.piview.backend.domain.product.compare.controller;

import com.piview.backend.domain.product.compare.dto.request.ProductCompareRequest;
import com.piview.backend.domain.product.compare.dto.response.ProductCompareResponse;
import com.piview.backend.domain.product.compare.service.ProductCompareService;
import com.piview.backend.global.exception.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "상품 비교 API", description = "상품 2개 비교 데이터 조회 API")
@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductCompareController {

    private final ProductCompareService productCompareService;

    @Operation(summary = "상품 2개 비교", description = "상품 ID 2개를 받아 비교용 데이터를 반환합니다.")
    @PostMapping("/compare")
    public ApiResponse<ProductCompareResponse> compareProducts(@Valid @RequestBody ProductCompareRequest request) {

        ProductCompareResponse response = productCompareService.compareProducts(request.getProductIds());
        return ApiResponse.success(response);
    }
}

package com.piview.backend.domain.product.compare.controller;

import com.piview.backend.domain.product.compare.dto.request.ProductCompareRequest;
import com.piview.backend.domain.product.compare.dto.response.ProductCompareResponse;
import com.piview.backend.domain.product.compare.service.ProductCompareService;
import com.piview.backend.global.exception.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "비교 조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "요청값 오류(2개 아님/중복 등)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "상품을 찾을 수 없음")
    })
    @PostMapping("/compare")
    public ApiResponse<ProductCompareResponse> compareProducts(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    description = "비교할 상품 ID 2개",
                    content = @Content(
                            schema = @Schema(implementation = ProductCompareRequest.class),
                            examples = @ExampleObject(
                                    name = "ProductCompareRequestExample",
                                    value = "{ \"productIds\": [1425, 1436] } "
                            )
                    )
            )
            @Valid @RequestBody ProductCompareRequest request) {

        ProductCompareResponse response = productCompareService.compareProducts(request.getProductIds());
        return ApiResponse.success(response);
    }
}

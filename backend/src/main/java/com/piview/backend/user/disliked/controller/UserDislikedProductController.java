package com.piview.backend.user.disliked.controller;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.exception.ErrorResponse;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.user.disliked.dto.response.DislikedProductCreateApiResponse;
import com.piview.backend.user.disliked.dto.response.DislikedProductDeleteApiResponse;
import com.piview.backend.user.disliked.dto.response.DislikedProductListApiResponse;
import com.piview.backend.user.disliked.dto.request.DislikedProductCreateRequest;
import com.piview.backend.user.disliked.dto.response.DislikedProductCreateResponse;
import com.piview.backend.user.disliked.dto.response.DislikedProductSummaryResponse;
import com.piview.backend.user.disliked.service.UserDislikedProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "안 맞는 제품 API", description = "사용자가 안 맞는 제품을 등록, 조회, 삭제하고, 등록된 제품 기준 문제 성분 목록을 확인하는 API입니다.")
@RestController
@RequestMapping("/users/me/disliked/products")
@RequiredArgsConstructor
public class UserDislikedProductController {

    private final UserDislikedProductService userDislikedProductService;

    // 안 맞는 제품 목록 조회 문서
    @Operation(
        summary = "안 맞는 제품 목록 조회",
        description = "로그인 사용자가 등록한 안 맞는 제품 목록을 조회합니다. 상품명, 브랜드명, 카테고리, 이미지, 용량, 가격, 추천 피부타입 정보를 함께 반환합니다."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "안 맞는 제품 목록 조회 성공",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = DislikedProductListApiResponse.class),
                examples = @ExampleObject(
                    name = "GetDislikedProductsSuccess",
                    summary = "목록 조회 성공",
                    value = "{\"status\":200,\"message\":\"요청에 성공했습니다.\",\"data\":[{\"dislikedProductId\":1,\"productId\":161485,\"productName\":\"판테토인 에센스 토너\",\"brandName\":\"마녀공장\",\"categoryName\":\"스킨/토너\",\"imageUrl\":\"161485.jpg\",\"volume\":\"200ml\",\"price\":32000,\"topSkinType\":\"combination\",\"top2SkinType\":\"oily\"}]}"
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401",
            description = "로그인이 필요함",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Unauthorized",
                    summary = "인증되지 않은 요청",
                    value = "{\"timestamp\":\"2026-03-19T06:58:09.428+00:00\",\"status\":401,\"error\":\"Unauthorized\",\"path\":\"/api/v1/users/me/disliked/products\"}"
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404",
            description = "사용자를 찾을 수 없음",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(
                    name = "UserNotFound",
                    summary = "사용자를 찾을 수 없음",
                    value = "{\"status\":404,\"error\":\"NOT_FOUND\",\"code\":\"USER_NOT_FOUND\",\"message\":\"해당 사용자를 찾을 수 없습니다.\"}"
                )
            )
        )
    })
    @GetMapping
    public ApiResponse<List<DislikedProductSummaryResponse>> getDislikedProducts(
        @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        // 실제 목록 조회는 Service에서 처리하고, 응답 형식만 맞춰서 반환한다.
        return ApiResponse.success(
            userDislikedProductService.getDislikedProducts(userPrincipal.getId())
        );
    }

    // 안 맞는 제품 삭제 문서
    @Operation(
        summary = "안 맞는 제품 삭제",
        description = "로그인 사용자의 안 맞는 제품 목록에서 특정 항목을 삭제합니다. 삭제할 때는 상품 ID가 아니라 `dislikedProductId`를 사용합니다."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "안 맞는 제품 삭제 성공",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = DislikedProductDeleteApiResponse.class),
                examples = @ExampleObject(
                    name = "DeleteDislikedProductSuccess",
                    summary = "삭제 성공",
                    value = "{\"status\":200,\"message\":\"요청에 성공했습니다.\"}"
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401",
            description = "로그인이 필요함",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Unauthorized",
                    summary = "인증되지 않은 요청",
                    value = "{\"timestamp\":\"2026-03-19T06:58:09.448+00:00\",\"status\":401,\"error\":\"Unauthorized\",\"path\":\"/api/v1/users/me/disliked/products/1\"}"
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404",
            description = "사용자를 찾을 수 없거나 삭제할 안 맞는 제품이 없음",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = {
                    @ExampleObject(
                        name = "UserNotFound",
                        summary = "사용자를 찾을 수 없음",
                        value = "{\"status\":404,\"error\":\"NOT_FOUND\",\"code\":\"USER_NOT_FOUND\",\"message\":\"해당 사용자를 찾을 수 없습니다.\"}"
                    ),
                    @ExampleObject(
                        name = "DislikedProductNotFound",
                        summary = "삭제 대상을 찾을 수 없음",
                        value = "{\"status\":404,\"error\":\"NOT_FOUND\",\"code\":\"DISLIKED_PRODUCT_NOT_FOUND\",\"message\":\"안 맞는 제품 목록에서 해당 상품을 찾을 수 없습니다.\"}"
                    )
                }
            )
        )
    })
    @DeleteMapping("/{dislikedProductId}")
    public ApiResponse<Void> deleteDislikedProduct(
        @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal,
        @Parameter(
            description = "삭제할 안 맞는 제품 ID입니다. 목록 조회 응답의 `dislikedProductId` 값을 사용합니다.",
            example = "1"
        )
        @PathVariable Long dislikedProductId
    ) {
        // 프론트는 상품 ID가 아니라 목록 응답으로 받은 dislikedProductId를 넘겨야 한다.
        userDislikedProductService.deleteDislikedProduct(userPrincipal.getId(), dislikedProductId);
        return ApiResponse.success();
    }

    // 안 맞는 제품 등록 문서
    @Operation(
        summary = "안 맞는 제품 등록",
        description = "기존 상품 검색 결과에서 선택한 `productId`를 기준으로 로그인 사용자의 안 맞는 제품 목록에 상품을 등록합니다. 상품 자체의 표시 정보는 저장하지 않고 `productId`만 저장합니다."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "안 맞는 제품 등록 성공",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = DislikedProductCreateApiResponse.class),
                examples = @ExampleObject(
                    name = "CreateDislikedProductSuccess",
                    summary = "등록 성공",
                    value = "{\"status\":200,\"message\":\"요청에 성공했습니다.\",\"data\":{\"dislikedProductId\":1}}"
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "요청값이 잘못된 경우",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(
                    name = "MissingProductId",
                    summary = "productId 누락",
                    value = "{\"status\":400,\"error\":\"BAD_REQUEST\",\"code\":\"INVALID_INPUT_VALUE\",\"message\":\"productId는 필수입니다.\"}"
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401",
            description = "로그인이 필요함",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Unauthorized",
                    summary = "인증되지 않은 요청",
                    value = "{\"timestamp\":\"2026-03-19T06:58:09.441+00:00\",\"status\":401,\"error\":\"Unauthorized\",\"path\":\"/api/v1/users/me/disliked/products\"}"
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404",
            description = "사용자 또는 상품을 찾을 수 없음",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = {
                    @ExampleObject(
                        name = "UserNotFound",
                        summary = "사용자를 찾을 수 없음",
                        value = "{\"status\":404,\"error\":\"NOT_FOUND\",\"code\":\"USER_NOT_FOUND\",\"message\":\"해당 사용자를 찾을 수 없습니다.\"}"
                    ),
                    @ExampleObject(
                        name = "ProductNotFound",
                        summary = "상품을 찾을 수 없음",
                        value = "{\"status\":404,\"error\":\"NOT_FOUND\",\"code\":\"COSMETICS_NOT_FOUND\",\"message\":\"해당 상품을 찾을 수 없습니다.\"}"
                    )
                }
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "409",
            description = "이미 안 맞는 제품으로 등록된 상품",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(
                    name = "AlreadyDislikedProduct",
                    summary = "중복 등록",
                    value = "{\"status\":409,\"error\":\"CONFLICT\",\"code\":\"ALREADY_DISLIKED_PRODUCT\",\"message\":\"이미 안 맞는 제품으로 등록된 상품입니다.\"}"
                )
            )
        )
    })
    @PostMapping
    public ApiResponse<DislikedProductCreateResponse> createDislikedProduct(
        @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal,
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "안 맞는 제품 등록 요청입니다. 프론트는 상품 검색 결과에서 선택한 `productId`만 보내면 됩니다.",
            required = true,
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = DislikedProductCreateRequest.class),
                examples = @ExampleObject(
                    name = "CreateDislikedProductRequest",
                    summary = "등록 요청 예시",
                    value = "{\"productId\":123}"
                )
            )
        )
        @Valid @RequestBody DislikedProductCreateRequest request
    ) {
        // Controller는 인증 사용자 ID와 요청 DTO를 Service에 넘기고,
        // 성공 응답 포맷은 프로젝트 공통 규약인 ApiResponse.success(...)로 감싼다.
        return ApiResponse.success(
            userDislikedProductService.createDislikedProduct(userPrincipal.getId(), request)
        );
    }
}

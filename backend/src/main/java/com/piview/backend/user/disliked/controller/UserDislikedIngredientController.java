package com.piview.backend.user.disliked.controller;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.exception.ErrorResponse;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.user.disliked.dto.response.DislikedIngredientListApiResponse;
import com.piview.backend.user.disliked.dto.response.DislikedIngredientSummaryResponse;
import com.piview.backend.user.disliked.service.UserDislikedProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "안 맞는 제품 API", description = "사용자가 안 맞는 제품을 등록, 조회, 삭제하고, 등록된 제품 기준 문제 성분 목록을 확인하는 API입니다.")
@RestController
@RequestMapping("/users/me/disliked/ingredients")
@RequiredArgsConstructor
public class UserDislikedIngredientController {

    private final UserDislikedProductService userDislikedProductService;

    // 문제 성분 목록 조회 문서
    @Operation(
        summary = "문제 성분 목록 조회",
        description = "로그인 사용자가 등록한 안 맞는 제품들을 기준으로 저장된 알레르기 유발 성분 목록을 조회합니다."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "문제 성분 목록 조회 성공",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = DislikedIngredientListApiResponse.class),
                examples = @ExampleObject(
                    name = "GetDislikedIngredientsSuccess",
                    summary = "문제 성분 목록 조회 성공",
                    value = "{\"status\":200,\"message\":\"요청에 성공했습니다.\",\"data\":[{\"ingredientId\":2,\"nameKo\":\"리모넨\",\"nameEn\":\"Limonene\",\"ewgGrade\":\"medium\"},{\"ingredientId\":1,\"nameKo\":\"향료\",\"nameEn\":\"Fragrance\",\"ewgGrade\":\"high\"}]}"
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
                    value = "{\"timestamp\":\"2026-03-19T07:45:10.099+00:00\",\"status\":401,\"error\":\"Unauthorized\",\"path\":\"/api/v1/users/me/disliked/ingredients\"}"
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
    public ApiResponse<List<DislikedIngredientSummaryResponse>> getDislikedIngredients(
        @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        // 현재 로그인 사용자의 문제 성분 목록만 조회한다.
        // 실제 계산과 조회는 Service에서 처리하고, Controller는 응답 형식만 맞춰서 반환한다.
        return ApiResponse.success(
            userDislikedProductService.getDislikedIngredients(userPrincipal.getId())
        );
    }
}

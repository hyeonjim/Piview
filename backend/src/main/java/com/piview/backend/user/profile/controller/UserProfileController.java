package com.piview.backend.user.profile.controller;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.user.profile.dto.request.UserProfileUpdateRequest;
import com.piview.backend.user.profile.dto.response.UserProfileApiResponse;
import com.piview.backend.user.profile.dto.response.UserProfileResponse;
import com.piview.backend.user.profile.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "마이페이지 API", description = "사용자 마이페이지 프로필 조회 및 수정 API입니다.")
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @Operation(summary = "내 정보 조회", description = "로그인 사용자의 마이페이지 프로필 정보를 조회합니다.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "내 정보 조회 성공",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserProfileApiResponse.class),
                examples = @ExampleObject(
                    name = "GetMyProfileSuccess",
                    summary = "내 정보 조회 성공",
                    value = "{\"status\":200,\"message\":\"요청에 성공했습니다.\",\"data\":{\"name\":\"김준\",\"email\":\"test@example.com\",\"imageUrl\":\"https://k.kakaocdn.net/dn/profile.jpg\",\"gender\":\"WOMEN\",\"ageGroup\":\"TWENTIES\",\"mySkinType\":\"DEHYDRATED_OILY\",\"skinProblems\":[\"수분\",\"진정\",\"피지\"]}}"
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 실패", content = @Content(schema = @Schema(hidden = true))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음", content = @Content(schema = @Schema(hidden = true)))
    })
    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> getMyProfile(
        @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return ApiResponse.success(userProfileService.getMyProfile(userPrincipal.getId()));
    }

    @Operation(
        summary = "내 정보 수정",
        description = "요청에 포함된 필드만 수정합니다. email은 수정하지 않습니다. skinProblems는 필드가 오면 전체 교체하며, 빈 배열 `[]`을 보내면 전체 삭제합니다. 요청에 없는 필드는 기존 값을 유지하고, `null`은 허용하지 않습니다. skinProblems에는 설문 문구(예: `홍조`, `속건조`)와 현재 응답에서 받은 값(예: `진정`, `수분`)을 모두 보낼 수 있습니다."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "내 정보 수정 성공",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserProfileApiResponse.class),
                examples = @ExampleObject(
                    name = "UpdateMyProfileSuccess",
                    summary = "내 정보 수정 성공",
                    value = "{\"status\":200,\"message\":\"요청에 성공했습니다.\",\"data\":{\"name\":\"김준\",\"email\":\"test@example.com\",\"imageUrl\":\"https://k.kakaocdn.net/dn/profile.jpg\",\"gender\":\"WOMEN\",\"ageGroup\":\"TWENTIES\",\"mySkinType\":\"OILY\",\"skinProblems\":[\"진정\",\"피지\"]}}"
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "잘못된 요청. null 값, 잘못된 enum 값, 허용되지 않은 필드, 잘못된 skinProblems 형식 등을 포함합니다.",
            content = @Content(
                mediaType = "application/json",
                examples = {
                    @ExampleObject(
                        name = "InvalidMySkinType",
                        summary = "mySkinType 에 null 전송",
                        value = "{\"status\":400,\"error\":\"BAD_REQUEST\",\"code\":\"INVALID_MY_SKIN_TYPE\",\"message\":\"피부타입 값이 올바르지 않습니다.\"}"
                    ),
                    @ExampleObject(
                        name = "InvalidSkinProblems",
                        summary = "skinProblems 에 null 전송",
                        value = "{\"status\":400,\"error\":\"BAD_REQUEST\",\"code\":\"INVALID_SKIN_PROBLEMS\",\"message\":\"피부 고민 목록 값이 올바르지 않습니다.\"}"
                    ),
                    @ExampleObject(
                        name = "UnknownField",
                        summary = "허용되지 않은 필드 전송",
                        value = "{\"status\":400,\"error\":\"BAD_REQUEST\",\"code\":\"INVALID_USER_PROFILE_REQUEST\",\"message\":\"내 정보 수정 요청 형식이 올바르지 않습니다.\"}"
                    )
                }
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 실패", content = @Content(schema = @Schema(hidden = true))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음", content = @Content(schema = @Schema(hidden = true)))
    })
    @PatchMapping("/me")
    public ApiResponse<UserProfileResponse> updateMyProfile(
        @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal,
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "부분 수정 요청 본문입니다. 포함된 필드만 수정합니다. skinProblems는 설문 문구와 현재 응답에서 받은 값을 모두 허용하며, 필드를 생략하면 유지되고 `[]`을 보내면 전체 삭제됩니다.",
            required = true,
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserProfileUpdateRequest.class),
                examples = {
                    @ExampleObject(
                        name = "PartialUpdate",
                        summary = "일부 필드만 수정",
                        value = "{\"name\":\"김준\",\"mySkinType\":\"OILY\"}"
                    ),
                    @ExampleObject(
                        name = "ReplaceSkinProblems",
                        summary = "skinProblems 전체 교체",
                        value = "{\"skinProblems\":[\"홍조\",\"피지\"]}"
                    ),
                    @ExampleObject(
                        name = "ClearSkinProblems",
                        summary = "skinProblems 전체 삭제",
                        value = "{\"skinProblems\":[]}"
                    )
                }
            )
        )
        @Valid @RequestBody UserProfileUpdateRequest request
    ) {
        return ApiResponse.success(userProfileService.updateMyProfile(userPrincipal.getId(), request));
    }
}

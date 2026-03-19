package com.piview.backend.user.disliked.controller;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.user.disliked.dto.request.DislikedProductCreateRequest;
import com.piview.backend.user.disliked.dto.response.DislikedProductCreateResponse;
import com.piview.backend.user.disliked.service.UserDislikedProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users/me/disliked/products")
@RequiredArgsConstructor
public class UserDislikedProductController {

    private final UserDislikedProductService userDislikedProductService;

    @PostMapping
    public ApiResponse<DislikedProductCreateResponse> createDislikedProduct(
        @AuthenticationPrincipal UserPrincipal userPrincipal,
        @Valid @RequestBody DislikedProductCreateRequest request
    ) {
        // Controller는 인증 사용자 ID와 요청 DTO를 Service에 넘기고,
        // 성공 응답 포맷은 프로젝트 공통 규약인 ApiResponse.success(...)로 감싼다.
        return ApiResponse.success(
            userDislikedProductService.createDislikedProduct(userPrincipal.getId(), request)
        );
    }
}

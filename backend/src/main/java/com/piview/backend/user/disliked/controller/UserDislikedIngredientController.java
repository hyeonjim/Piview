package com.piview.backend.user.disliked.controller;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.user.disliked.dto.response.DislikedIngredientSummaryResponse;
import com.piview.backend.user.disliked.service.UserDislikedProductService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users/me/disliked/ingredients")
@RequiredArgsConstructor
public class UserDislikedIngredientController {

    private final UserDislikedProductService userDislikedProductService;

    @GetMapping
    public ApiResponse<List<DislikedIngredientSummaryResponse>> getDislikedIngredients(
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        // 현재 로그인 사용자의 문제 성분 목록만 조회한다.
        return ApiResponse.success(
            userDislikedProductService.getDislikedIngredients(userPrincipal.getId())
        );
    }
}

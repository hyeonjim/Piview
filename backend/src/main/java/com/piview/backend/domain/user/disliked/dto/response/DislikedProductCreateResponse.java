package com.piview.backend.domain.user.disliked.dto.response;

public record DislikedProductCreateResponse(
    // 생성된 안 맞는 제품 목록 항목 ID
    @io.swagger.v3.oas.annotations.media.Schema(description = "생성된 안 맞는 제품 목록 항목 ID입니다.", example = "1")
    Long dislikedProductId
) {
}

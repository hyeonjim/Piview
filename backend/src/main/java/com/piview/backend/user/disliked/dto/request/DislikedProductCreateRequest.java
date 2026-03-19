package com.piview.backend.user.disliked.dto.request;

import jakarta.validation.constraints.NotNull;

public record DislikedProductCreateRequest(
    // 프론트는 기존 상품 검색 결과에서 선택한 productId만 넘기면 된다.
    @NotNull(message = "productId는 필수입니다.")
    Long productId
) {
}

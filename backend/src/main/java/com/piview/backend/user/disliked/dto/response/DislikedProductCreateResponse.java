package com.piview.backend.user.disliked.dto.response;

public record DislikedProductCreateResponse(
    // 생성된 안 맞는 제품 등록 행의 PK
    Long dislikedProductId
) {
}

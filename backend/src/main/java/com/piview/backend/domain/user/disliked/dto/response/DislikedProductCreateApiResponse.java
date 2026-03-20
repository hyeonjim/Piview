package com.piview.backend.domain.user.disliked.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "안 맞는 제품 등록 응답입니다.")
public record DislikedProductCreateApiResponse(
    @Schema(description = "HTTP 상태 코드입니다.", example = "200")
    int status,

    @Schema(description = "성공 메시지입니다.", example = "요청에 성공했습니다.")
    String message,

    @Schema(description = "안 맞는 제품 등록 결과 데이터입니다.")
    DislikedProductCreateResponse data
) {
}

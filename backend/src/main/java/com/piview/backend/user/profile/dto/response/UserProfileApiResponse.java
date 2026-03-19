package com.piview.backend.user.profile.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "마이페이지 내 정보 조회/수정 API 공통 응답입니다.")
public record UserProfileApiResponse(
    @Schema(description = "HTTP 상태 코드입니다.", example = "200")
    int status,

    @Schema(description = "성공 메시지입니다.", example = "요청에 성공했습니다.")
    String message,

    @Schema(description = "마이페이지 프로필 데이터입니다.")
    UserProfileResponse data
) {
}

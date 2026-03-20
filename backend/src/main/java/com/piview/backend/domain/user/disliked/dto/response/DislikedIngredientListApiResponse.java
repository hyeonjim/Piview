package com.piview.backend.domain.user.disliked.dto.response;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "문제 성분 목록 조회 응답입니다.")
// 문제 성분 조회 API의 실제 응답 래퍼 구조를 Swagger에 맞춰 표현한다.
public record DislikedIngredientListApiResponse(
    @Schema(description = "HTTP 상태 코드입니다.", example = "200")
    int status,

    @Schema(description = "성공 메시지입니다.", example = "요청에 성공했습니다.")
    String message,

    @ArraySchema(
        schema = @Schema(implementation = DislikedIngredientSummaryResponse.class),
        arraySchema = @Schema(description = "조회된 문제 성분 목록입니다.")
    )
    List<DislikedIngredientSummaryResponse> data
) {
}

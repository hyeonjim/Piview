package com.piview.backend.domain.chatbot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "챗봇 질의 API 공통 성공 응답입니다.")
public record ChatbotQueryApiResponse(
    @Schema(description = "HTTP 상태 코드입니다.", example = "200")
    int status,

    @Schema(description = "성공 메시지입니다.", example = "요청에 성공했습니다.")
    String message,

    @Schema(description = "챗봇 응답 데이터입니다.")
    ChatbotQueryResponse data
) {
}

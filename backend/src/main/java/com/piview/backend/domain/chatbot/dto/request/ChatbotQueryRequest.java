package com.piview.backend.domain.chatbot.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "챗봇 질의 요청 DTO입니다.")
public record ChatbotQueryRequest(
    @Schema(description = "사용자 질문입니다.", example = "민감하고 속건조인데 향료 강한 토너는 피하고 싶어")
    @NotBlank(message = "message는 필수입니다.")
    @Size(max = 2000, message = "message는 2000자를 넘길 수 없습니다.")
    String message,

    @Schema(description = "세션 식별자입니다. 없으면 AI 서버가 새로 발급합니다.", nullable = true, example = "optional-session-id")
    String sessionId,

    @Valid
    @Schema(description = "현재 화면/상품 상세 등의 클라이언트 문맥입니다.", nullable = true)
    ChatbotClientContext context
) {
    @Schema(description = "클라이언트 화면 문맥입니다.")
    public record ChatbotClientContext(
        @Schema(description = "질의가 발생한 화면입니다.", nullable = true, example = "search")
        String screen,

        @Schema(description = "현재 보고 있는 상품 ID입니다.", nullable = true, example = "161485")
        Long currentProductId
    ) {
    }
}

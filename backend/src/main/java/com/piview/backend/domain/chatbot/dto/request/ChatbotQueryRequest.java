package com.piview.backend.domain.chatbot.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "챗봇 질의 요청 DTO입니다. 로그인 사용자 기준 개인화 정보는 backend가 자동으로 채워 넣으므로, 클라이언트는 질문과 화면 문맥만 보내면 됩니다.")
public record ChatbotQueryRequest(
    @Schema(
        description = "사용자 질문입니다. 카테고리(예: 토너, 크림), 피부 고민(예: 속건조, 진정), 피하고 싶은 조건(예: 향료, 끈적임)을 자연어로 적으면 됩니다.",
        example = "민감하고 속건조인데 향이 강한 토너는 피하고 싶어"
    )
    @NotBlank(message = "message는 필수입니다.")
    @Size(max = 2000, message = "message는 2000자를 넘길 수 없습니다.")
    String message,

    @Schema(
        description = "대화 세션 식별자입니다. 첫 질문에서는 비워도 되고, 후속 질문에서는 이전 응답의 `sessionId`를 그대로 보내면 대화 맥락이 이어집니다.",
        nullable = true,
        example = "optional-session-id"
    )
    String sessionId,

    @Valid
    @Schema(description = "현재 사용자가 어디서 질문했는지 알려주는 화면 문맥입니다. 검색 화면인지, 상품 상세 화면인지 같은 정보만 가볍게 전달하면 됩니다.", nullable = true)
    ChatbotClientContext context
) {
    @Schema(description = "클라이언트 화면 문맥입니다.")
    public record ChatbotClientContext(
        @Schema(description = "질의가 발생한 화면입니다. 예: `search`, `detail`.", nullable = true, example = "search")
        String screen,

        @Schema(description = "상품 상세 화면처럼 특정 상품을 기준으로 질문할 때 사용하는 상품 ID입니다. 검색 화면처럼 기준 상품이 없으면 비워도 됩니다.", nullable = true, example = "161485")
        Long currentProductId
    ) {
    }
}

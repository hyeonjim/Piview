package com.piview.backend.domain.chatbot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.Map;

@Schema(description = "챗봇 질의 응답 DTO입니다.")
public record ChatbotQueryResponse(
    @Schema(description = "세션 식별자입니다.", example = "session-id")
    String sessionId,

    @Schema(description = "챗봇 답변 본문입니다.", example = "민감하고 속건조 기준으로 볼 때 보습/진정 성향의 토너를 우선 보는 편이 좋습니다.")
    String answer,

    @Schema(description = "근거 상품 목록입니다.")
    List<ChatbotProductCandidate> products,

    @Schema(description = "질의 해석 결과로 적용된 필터입니다.")
    Map<String, Object> appliedFilters,

    @Schema(description = "근거 citation 목록입니다.")
    List<ChatbotCitation> citations
) {
    @Schema(description = "챗봇 응답에 포함되는 상품 후보입니다.")
    public record ChatbotProductCandidate(
        @Schema(description = "상품 ID입니다.", nullable = true, example = "123")
        Long productId,

        @Schema(description = "상품명입니다.", example = "예시 토너")
        String name,

        @Schema(description = "브랜드명입니다.", nullable = true, example = "예시 브랜드")
        String brandName,

        @Schema(description = "추천/인용 근거입니다.", nullable = true, example = "수분 관련 concern이 강하고 향료 주의 성분이 상대적으로 적습니다.")
        String reason
    ) {
    }

    @Schema(description = "챗봇 응답 citation입니다.")
    public record ChatbotCitation(
        @Schema(description = "citation 종류입니다.", example = "product")
        String type,

        @Schema(description = "상품 ID입니다.", nullable = true, example = "123")
        Long productId,

        @Schema(description = "추가 citation 텍스트입니다.", nullable = true, example = "민감 피부용 보습 토너")
        String text
    ) {
    }
}

package com.piview.backend.domain.chatbot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.Map;

@Schema(description = "챗봇 질의 응답 DTO입니다. 답변 본문과 함께 추천 상품 후보, 질의 해석에 사용된 필터, 근거 문구를 반환합니다.")
public record ChatbotQueryResponse(
    @Schema(description = "세션 식별자입니다.", example = "session-id")
    String sessionId,

    @Schema(description = "챗봇 답변 본문입니다. 추천 상품이 없더라도 일반 가이드 답변은 내려올 수 있습니다.", example = "민감하고 속건조 기준으로 볼 때 보습/진정 성향의 토너를 우선 보는 편이 좋습니다.")
    String answer,

    @Schema(description = "추천 또는 참고용으로 함께 내려주는 상품 목록입니다. 질문 성격에 따라 비어 있을 수 있습니다.")
    List<ChatbotProductCandidate> products,

    @Schema(
        description = "AI가 답변 생성 시 실제로 반영한 조건 스냅샷입니다. 화면 문맥, 피부타입, 피부 고민 등이 포함될 수 있습니다.",
        example = "{\"screen\":\"search\",\"mySkinType\":\"combination\",\"skinProblems\":[\"진정\",\"수분\",\"피지\"]}"
    )
    Map<String, Object> appliedFilters,

    @Schema(description = "답변이나 추천에 사용된 근거 문구 목록입니다. 보통 상품명과 관련 고민, 짧은 인용 문구가 들어갑니다.")
    List<ChatbotCitation> citations
) {
    @Schema(description = "챗봇 응답에 포함되는 상품 후보입니다.")
    public record ChatbotProductCandidate(
        @Schema(description = "상품 ID입니다.", nullable = true, example = "123")
        Long productId,

        @Schema(description = "상품명입니다.", example = "카모마일 버쳐스 꽃 진정크림")
        String name,

        @Schema(description = "브랜드명입니다.", nullable = true, example = "엘보라리오")
        String brandName,

        @Schema(description = "왜 이 상품이 같이 제시되었는지 보여주는 짧은 설명입니다. 카테고리, 관련 고민, 피부타입 힌트, 성분 메모 등이 들어갈 수 있습니다.", nullable = true, example = "크림 카테고리 / 관련 고민 수분, 진정 / 피부타입 힌트 dry")
        String reason
    ) {
    }

    @Schema(description = "챗봇 응답 citation입니다.")
    public record ChatbotCitation(
        @Schema(description = "citation 종류입니다. 현재는 주로 `product`가 사용됩니다.", example = "product")
        String type,

        @Schema(description = "상품 ID입니다.", nullable = true, example = "123")
        Long productId,

        @Schema(description = "근거 문구입니다. 상품명과 관련 고민 요약처럼 사용자가 바로 읽을 수 있는 형태로 내려옵니다.", nullable = true, example = "카모마일 버쳐스 꽃 진정크림 (엘보라리오) / 관련 고민: 수분, 진정")
        String text
    ) {
    }
}

package com.piview.backend.domain.chatbot.service;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class ChatbotAiClient {

    private final RestClient restClient;
    private final String fastApiBaseUrl;

    public ChatbotAiClient(@Value("${fastapi.base-url}") String fastApiBaseUrl) {
        this.fastApiBaseUrl = fastApiBaseUrl;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(3000);
        requestFactory.setReadTimeout(30000);

        this.restClient = RestClient.builder()
            .requestFactory(requestFactory)
            .build();
    }

    public ChatbotAiQueryResponse query(ChatbotAiQueryRequest request) {
        try {
            // backend -> ai 내부 호출 계약
            // - URL: {fastapi.base-url}/chat/query
            // - body: ChatbotAiQueryRequest JSON
            // - response: ChatbotAiQueryResponse JSON
            //
            // 공개 API에서는 ApiResponse를 쓰지만, 내부 AI API는 순수 JSON만 사용한다.
            ChatbotAiQueryResponse response = restClient.post()
                .uri(fastApiBaseUrl + "/chat/query")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(ChatbotAiQueryResponse.class);

            if (response == null) {
                throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
            }

            return response;
        } catch (RestClientException exception) {
            // 내부 AI 호출 실패는 일단 기존 OCR/피부분석과 같은 계열의 가용성 오류로 맞춘다.
            throw new CustomException(ErrorCode.AI_SERVER_TIMEOUT);
        }
    }
}

record ChatbotAiQueryRequest(
    // 사용자의 원문 질문
    String message,
    // 세션 식별자. 없으면 ai가 새로 발급할 수 있다.
    String sessionId,
    // 현재 화면/상품 상세 등 클라이언트 진입 문맥
    ChatbotAiClientContext context,
    // backend가 여러 사용자 테이블에서 읽어 조립한 개인화 문맥
    ChatbotAiUserContext userContext
) {
}

record ChatbotAiClientContext(
    // 예: search, product-detail
    String screen,
    // 현재 보고 있는 상품 ID. 상세 진입점일 때 사용 가능
    Long currentProductId
) {
}

record ChatbotAiUserContext(
    // 현재 로그인 사용자 ID
    Long userId,
    // 사용자 피부 타입
    String mySkinType,
    // 사용자 피부 고민 목록
    List<String> skinProblems,
    // 현재 보유 제품의 productId 목록
    List<Long> myCosProductIds,
    // 피하고 싶은 성분명 목록
    List<String> dislikedIngredientNames,
    // 피하고 싶은 제품의 productId 목록
    List<Long> dislikedProductIds
) {
}

record ChatbotAiQueryResponse(
    // ai가 돌려준 세션 식별자
    String sessionId,
    // 최종 자연어 답변
    String answer,
    // 근거 상품 후보
    List<ChatbotAiProductCandidate> products,
    // ai가 실제로 적용했다고 판단한 필터/해석 결과
    Map<String, Object> appliedFilters,
    // citation 목록
    List<ChatbotAiCitation> citations
) {
}

record ChatbotAiProductCandidate(
    // 상품 ID
    Long productId,
    // 상품명
    String name,
    // 브랜드명
    String brandName,
    // 왜 이 상품을 언급했는지에 대한 설명
    String reason
) {
}

record ChatbotAiCitation(
    // citation 종류. 현재는 주로 product
    String type,
    // 근거 상품 ID
    Long productId,
    // 추가 근거 텍스트
    String text
) {
}

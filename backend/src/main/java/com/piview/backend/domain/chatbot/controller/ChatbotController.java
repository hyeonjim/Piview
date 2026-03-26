package com.piview.backend.domain.chatbot.controller;

import com.piview.backend.domain.chatbot.dto.request.ChatbotQueryRequest;
import com.piview.backend.domain.chatbot.dto.response.ChatbotQueryApiResponse;
import com.piview.backend.domain.chatbot.dto.response.ChatbotQueryResponse;
import com.piview.backend.domain.chatbot.service.ChatbotService;
import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.exception.ErrorResponse;
import com.piview.backend.global.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "챗봇 API", description = "로그인 사용자의 문맥을 반영해 AI 챗봇 응답을 반환합니다.")
@RestController
@RequestMapping("/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @Operation(
        summary = "챗봇 질의",
        description = "로그인 사용자의 질문을 받아 챗봇 답변과 추천 상품 후보를 반환합니다. "
            + "클라이언트는 `message`, 선택적 `sessionId`, 화면 문맥(`context`)만 보내면 되고, "
            + "피부타입/피부고민/보유 제품/안 맞는 성분 같은 개인화 정보는 backend가 로그인 사용자 기준으로 자동 반영합니다."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "챗봇 질의 성공",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ChatbotQueryApiResponse.class),
                examples = @ExampleObject(
                    name = "ChatbotQuerySuccess",
                    summary = "상품 추천이 포함된 성공 응답",
                    value = "{\"status\":200,\"message\":\"요청에 성공했습니다.\",\"data\":{\"sessionId\":\"aa80701f-08e4-4a6c-84d7-f97637deb941\",\"answer\":\"속건조와 진정이 필요하고 향이 강한 제품은 피하고 싶으시군요. 저녁에 사용할 수분크림이나 젤크림을 찾으신다면, 수분 공급과 진정에 도움을 줄 수 있는 제품들 중에서 향이 강하지 않은 쪽으로 고려해볼 수 있습니다.\",\"products\":[{\"productId\":5825,\"name\":\"워터 볼륨 아쿠아 젤 크림\",\"brandName\":\"미즈온\",\"reason\":\"크림 카테고리 / 관련 고민 노화방지-40대이상,속건조,주름/탄력,진정 / 피부타입 힌트 oily / 전성분 메모 '정제수', '에탄올', '부틸렌글라이콜', '나이아신아마이드' 등\"},{\"productId\":2011,\"name\":\"카모마일 버쳐스 꽃 진정크림\",\"brandName\":\"엘보라리오\",\"reason\":\"크림 카테고리 / 관련 고민 수분, 진정 / 피부타입 힌트 dry\"}],\"appliedFilters\":{\"screen\":\"search\",\"mySkinType\":\"combination\",\"skinProblems\":[\"진정\",\"수분\",\"피지\"]},\"citations\":[{\"type\":\"product\",\"productId\":5825,\"text\":\"워터 볼륨 아쿠아 젤 크림 (미즈온) / 관련 고민: 노화방지-40대이상,속건조,주름/탄력,진정\"}]}}"
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "요청값이 잘못된 경우",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = {
                    @ExampleObject(
                        name = "BlankMessage",
                        summary = "message 누락 또는 공백",
                        value = "{\"status\":400,\"error\":\"BAD_REQUEST\",\"code\":\"INVALID_REQUEST\",\"message\":\"잘못된 요청입니다.\"}"
                    ),
                    @ExampleObject(
                        name = "MessageTooLong",
                        summary = "message 길이 초과",
                        value = "{\"status\":400,\"error\":\"BAD_REQUEST\",\"code\":\"INVALID_REQUEST\",\"message\":\"잘못된 요청입니다.\"}"
                    )
                }
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401",
            description = "로그인이 필요함",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Unauthorized",
                    summary = "인증되지 않은 요청",
                    value = "{\"timestamp\":\"2026-03-25T10:20:00.000+00:00\",\"status\":401,\"error\":\"Unauthorized\",\"path\":\"/api/v1/chatbot/query\"}"
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "502",
            description = "AI 서버 호출은 되었지만 요청 형식 오류, 처리 오류, 응답 형식 오류가 발생한 경우",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = {
                    @ExampleObject(
                        name = "AiServerBadRequest",
                        summary = "AI 서버 요청 형식 오류",
                        value = "{\"status\":502,\"error\":\"BAD_GATEWAY\",\"code\":\"AI_SERVER_BAD_REQUEST\",\"message\":\"AI 서버 요청 형식이 올바르지 않습니다.\"}"
                    ),
                    @ExampleObject(
                        name = "AiServerError",
                        summary = "AI 서버 내부 처리 오류",
                        value = "{\"status\":502,\"error\":\"BAD_GATEWAY\",\"code\":\"AI_SERVER_ERROR\",\"message\":\"AI 서버 처리 중 오류가 발생했습니다.\"}"
                    ),
                    @ExampleObject(
                        name = "AiServerInvalidResponse",
                        summary = "AI 서버 응답 형식 오류",
                        value = "{\"status\":502,\"error\":\"BAD_GATEWAY\",\"code\":\"AI_SERVER_INVALID_RESPONSE\",\"message\":\"AI 서버 응답 형식이 올바르지 않습니다.\"}"
                    )
                }
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "503",
            description = "AI 서버 응답이 지연된 경우",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(
                    name = "AiServerTimeout",
                    summary = "AI 서버 타임아웃",
                    value = "{\"status\":503,\"error\":\"SERVICE_UNAVAILABLE\",\"code\":\"AI_SERVER_TIMEOUT\",\"message\":\"AI 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.\"}"
                )
            )
        )
    })
    @PostMapping("/query")
    public ApiResponse<ChatbotQueryResponse> query(
        @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal,
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "챗봇 질의 요청입니다. "
                + "`message`는 필수이고, `sessionId`는 직전 응답의 값을 이어서 보내면 대화 맥락이 유지됩니다. "
                + "`context`는 현재 화면이 검색인지 상세인지 같은 UI 문맥만 가볍게 전달할 때 사용합니다.",
            required = true,
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ChatbotQueryRequest.class),
                examples = {
                    @ExampleObject(
                        name = "SearchChatRequest",
                        summary = "검색 화면에서 새 질문",
                        value = "{\"message\":\"속건조가 있고 진정이 필요한 편이야. 향이 강한 제품은 피하고 싶고, 저녁에 쓸 수분크림이나 젤크림 추천해줘.\",\"sessionId\":null,\"context\":{\"screen\":\"search\",\"currentProductId\":null}}"
                    ),
                    @ExampleObject(
                        name = "DetailFollowUpRequest",
                        summary = "상품 상세 화면에서 후속 질문",
                        value = "{\"message\":\"이 제품이랑 비슷한데 더 가벼운 제형으로 추천해줘.\",\"sessionId\":\"aa80701f-08e4-4a6c-84d7-f97637deb941\",\"context\":{\"screen\":\"detail\",\"currentProductId\":161485}}"
                    )
                }
            )
        )
        @Valid @RequestBody ChatbotQueryRequest request
    ) {
        return ApiResponse.success(chatbotService.query(userPrincipal.getId(), request));
    }
}

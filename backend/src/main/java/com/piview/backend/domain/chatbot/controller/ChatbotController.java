package com.piview.backend.domain.chatbot.controller;

import com.piview.backend.domain.chatbot.dto.request.ChatbotQueryRequest;
import com.piview.backend.domain.chatbot.dto.response.ChatbotQueryResponse;
import com.piview.backend.domain.chatbot.service.ChatbotService;
import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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

    @Operation(summary = "챗봇 질의", description = "사용자 질문을 받아 AI 챗봇 응답과 근거 메타데이터를 반환합니다.")
    @PostMapping("/query")
    public ApiResponse<ChatbotQueryResponse> query(
        @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal,
        @Valid @RequestBody ChatbotQueryRequest request
    ) {
        return ApiResponse.success(chatbotService.query(userPrincipal.getId(), request));
    }
}

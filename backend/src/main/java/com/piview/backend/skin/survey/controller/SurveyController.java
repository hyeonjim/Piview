package com.piview.backend.skin.survey.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.skin.survey.dto.request.SurveySubmitRequest;
import com.piview.backend.skin.survey.dto.response.SurveySubmitResponse;
import com.piview.backend.skin.survey.service.SurveyService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "피부 설문 API", description = "피부 분석 결과와 설문 응답을 합쳐 최종 피부 타입을 계산하는 API입니다.")
@RestController
@RequestMapping("/skin/surveys")
@RequiredArgsConstructor
public class SurveyController {

    private final SurveyService surveyService;

    @Operation(
        summary = "최종 피부 설문 제출",
        description = "analysisId 기준으로 Redis에 저장된 AI 분석 결과를 읽어 설문 응답과 합산하고, 최종 피부 타입과 피부 고민 태그를 계산합니다. 응답에는 프론트 표시용으로 정리한 AI 결과도 함께 포함됩니다."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "최종 피부 설문 제출 성공"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 설문 입력값", content = @Content(schema = @Schema(hidden = true))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 실패", content = @Content(schema = @Schema(hidden = true))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "다른 사용자의 분석 결과 제출 시도", content = @Content(schema = @Schema(hidden = true))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "analysisId를 찾을 수 없음", content = @Content(schema = @Schema(hidden = true))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "분석 미완료, 분석 실패, 이미 제출된 분석 또는 중복 제출 요청", content = @Content(schema = @Schema(hidden = true)))
    })
    @PostMapping("/{analysisId}")
    public ApiResponse<SurveySubmitResponse> submitSurvey(
        @AuthenticationPrincipal UserPrincipal userPrincipal,
        @Parameter(description = "capture API에서 발급받은 피부 분석 작업 식별자입니다.", example = "35e9064f-7c69-48ee-be1f-5a4a600ad88d")
        @PathVariable String analysisId,
        @Valid @RequestBody SurveySubmitRequest request
    ) {
        return ApiResponse.success(surveyService.submitSurvey(userPrincipal.getId(), analysisId, request));
    }
}

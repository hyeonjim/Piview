package com.piview.backend.domain.skin.survey.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
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
import com.piview.backend.domain.skin.survey.dto.request.SurveySubmitRequest;
import com.piview.backend.domain.skin.survey.dto.response.SurveySubmitResponse;
import com.piview.backend.domain.skin.survey.service.SurveyService;

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
        description = "analysisId 기준으로 Redis에 저장된 AI 분석 결과를 읽어 설문 응답과 합산하고, 최종 피부 타입과 피부 고민 태그를 계산합니다. 이 API는 AI 분석 상태가 COMPLETED일 때만 호출할 수 있으며, 이미 제출이 끝난 analysisId나 처리 중인 analysisId는 409를 반환합니다. 응답에는 프론트 표시용으로 정리한 AI 결과도 함께 포함됩니다."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "최종 피부 설문 제출 성공",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = SurveySubmitResponse.class),
                examples = @ExampleObject(
                    name = "SurveySubmitSuccess",
                    summary = "정상 제출 응답",
                    value = "{\"status\":200,\"message\":\"요청에 성공했습니다.\",\"data\":{\"analysisId\":\"35e9064f-7c69-48ee-be1f-5a4a600ad88d\",\"mySkinType\":\"DEHYDRATED_OILY\",\"skinProblems\":[\"진정\",\"수분\",\"피지\"],\"aiResult\":{\"global_face\":{\"axis\":\"oily_side\",\"display_dry_probability\":37.8,\"display_oily_probability\":62.2},\"regional_skin_type\":{\"forehead\":{\"axis\":\"oily_side\",\"display_dry_probability\":31.4,\"display_oily_probability\":68.6},\"left_cheek\":{\"axis\":\"dry_side\",\"display_dry_probability\":64.1,\"display_oily_probability\":35.9},\"right_cheek\":{\"axis\":\"dry_side\",\"display_dry_probability\":67.4,\"display_oily_probability\":32.6},\"cheek_mean_axis\":\"dry_side\",\"display_dry_probability\":65.78,\"display_oily_probability\":34.22,\"regional_difference_exists\":true,\"forehead_oily_cheek_dry\":true},\"moisture\":{\"cheekMeanScore\":41.52,\"state\":\"low\"},\"roi_metadata\":{\"coordinate_space\":\"original_normalized\",\"image_size\":{\"width\":2544,\"height\":3392},\"alignment\":{\"rotate_deg\":1.0887,\"flipped_180\":false},\"rois\":{\"forehead\":{\"bbox\":{\"x1\":0.250786,\"y1\":0.404481,\"x2\":0.507469,\"y2\":0.5398}},\"left_cheek\":{\"bbox\":{\"x1\":0.1761,\"y1\":0.4942,\"x2\":0.3775,\"y2\":0.7068}},\"right_cheek\":{\"bbox\":{\"x1\":0.5443,\"y1\":0.4921,\"x2\":0.7452,\"y2\":0.7059}}}},\"warnings\":[]}}}"
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "잘못된 설문 입력값",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "InvalidSurveyRequest",
                    summary = "필수 필드 누락 또는 허용되지 않은 문항 값",
                    value = "{\"status\":400,\"error\":\"BAD_REQUEST\",\"code\":\"INVALID_REQUEST\",\"message\":\"잘못된 요청입니다.\"}"
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 실패", content = @Content(schema = @Schema(hidden = true))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "다른 사용자의 분석 결과 제출 시도", content = @Content(schema = @Schema(hidden = true))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "analysisId를 찾을 수 없음", content = @Content(schema = @Schema(hidden = true))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "409",
            description = "분석 미완료, 분석 실패, 이미 제출된 분석 또는 중복 제출 요청",
            content = @Content(
                mediaType = "application/json",
                examples = {
                    @ExampleObject(
                        name = "AnalysisNotCompleted",
                        summary = "AI 분석이 아직 끝나지 않은 경우",
                        value = "{\"status\":409,\"error\":\"CONFLICT\",\"code\":\"SKIN_ANALYSIS_NOT_COMPLETED\",\"message\":\"피부 분석이 아직 완료되지 않았습니다. 잠시 후 다시 시도해주세요.\"}"
                    ),
                    @ExampleObject(
                        name = "AnalysisFailed",
                        summary = "AI 분석이 실패한 경우",
                        value = "{\"status\":409,\"error\":\"CONFLICT\",\"code\":\"SKIN_ANALYSIS_FAILED\",\"message\":\"피부 분석에 실패했습니다. 다시 촬영한 뒤 시도해주세요.\"}"
                    ),
                    @ExampleObject(
                        name = "AlreadyConsumed",
                        summary = "이미 최종 제출이 끝난 analysisId",
                        value = "{\"status\":409,\"error\":\"CONFLICT\",\"code\":\"SKIN_ANALYSIS_ALREADY_CONSUMED\",\"message\":\"이미 최종 제출이 완료된 분석입니다.\"}"
                    ),
                    @ExampleObject(
                        name = "SubmitInProgress",
                        summary = "같은 analysisId로 중복 제출 중",
                        value = "{\"status\":409,\"error\":\"CONFLICT\",\"code\":\"SKIN_SURVEY_SUBMIT_IN_PROGRESS\",\"message\":\"이미 처리 중인 요청입니다. 잠시 후 다시 시도해주세요.\"}"
                    )
                }
            )
        )
    })
    @PostMapping("/{analysisId}")
    public ApiResponse<SurveySubmitResponse> submitSurvey(
        @AuthenticationPrincipal UserPrincipal userPrincipal,
        @Parameter(description = "capture API에서 발급받은 피부 분석 작업 식별자입니다.", example = "35e9064f-7c69-48ee-be1f-5a4a600ad88d")
        @PathVariable String analysisId,
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "최종 피부 설문 요청 본문입니다. gender, ageGroup, 문항 3~6 응답, 문항 7 피부 고민 다중 선택 목록을 함께 보냅니다.",
            required = true,
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = SurveySubmitRequest.class),
                examples = {
                    @ExampleObject(
                        name = "SurveySubmitRequestExample",
                        summary = "대표 요청 예시",
                        value = "{\"gender\":\"WOMEN\",\"ageGroup\":\"TWENTIES\",\"question3\":\"D\",\"question4\":\"C\",\"question5\":\"A\",\"question6\":\"C\",\"skinProblems\":[\"홍조\",\"속건조\",\"피지\"]}"
                    ),
                    @ExampleObject(
                        name = "SurveySubmitFortiesPlus",
                        summary = "40대 이상 요청 예시",
                        value = "{\"gender\":\"MEN\",\"ageGroup\":\"FORTIES_PLUS\",\"question3\":\"B\",\"question4\":\"D\",\"question5\":\"B\",\"question6\":\"B\",\"skinProblems\":[\"주름/탄력\",\"피지\"]}"
                    )
                }
            )
        )
        @Valid @RequestBody SurveySubmitRequest request
    ) {
        return ApiResponse.success(surveyService.submitSurvey(userPrincipal.getId(), analysisId, request));
    }
}

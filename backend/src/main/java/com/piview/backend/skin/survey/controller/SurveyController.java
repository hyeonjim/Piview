package com.piview.backend.skin.survey.controller;

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

@RestController
@RequestMapping("/skin/surveys")
@RequiredArgsConstructor
public class SurveyController {

    private final SurveyService surveyService;

    @PostMapping("/{analysisId}")
    public ApiResponse<SurveySubmitResponse> submitSurvey(
        @AuthenticationPrincipal UserPrincipal userPrincipal,
        @PathVariable String analysisId,
        @Valid @RequestBody SurveySubmitRequest request
    ) {
        return ApiResponse.success(surveyService.submitSurvey(userPrincipal.getId(), analysisId, request));
    }
}

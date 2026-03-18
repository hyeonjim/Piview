package com.piview.backend.skin.survey.dto.response;

import java.util.List;

import com.piview.backend.skin.survey.entity.SurveySkinType;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "최종 피부 설문 제출 응답 DTO")
public class SurveySubmitResponse {

    @Schema(description = "이번 최종 제출에 사용된 피부 분석 작업 식별자", example = "35e9064f-7c69-48ee-be1f-5a4a600ad88d")
    private String analysisId;

    @Schema(description = "설문 응답과 AI 분석 결과를 합산해 계산한 최종 피부 타입", implementation = SurveySkinType.class, example = "COMBINATION")
    private SurveySkinType mySkinType;

    @Schema(description = "문항 7 입력값을 내부 저장 태그 기준으로 변환한 최종 피부 고민 목록")
    private List<String> skinProblems;

    @Schema(description = "프론트 표시용으로 정리한 AI 분석 결과")
    private SurveyAiResultResponse aiResult;
}

package com.piview.backend.domain.skin.survey.dto.response;

import java.util.List;

import com.piview.backend.domain.skin.survey.entity.SurveySkinType;

import io.swagger.v3.oas.annotations.media.ArraySchema;
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

    @ArraySchema(
        schema = @Schema(
            description = "최종 피부 고민 저장 태그입니다. 응답은 설문 원문이 아니라 내부 저장 태그 기준으로 내려갑니다.",
            example = "진정"
        ),
        arraySchema = @Schema(
            description = "문항 7 입력값을 내부 저장 태그 기준으로 변환한 최종 피부 고민 목록입니다. ageGroup이 FORTIES_PLUS면 `안티에이징` 태그가 자동 추가될 수 있습니다.",
            example = "[\"진정\", \"수분\", \"피지\"]"
        )
    )
    private List<String> skinProblems;

    @Schema(description = "프론트 표시용으로 정리한 AI 분석 결과입니다. global face, 부위별 축, 수분 상태, ROI 메타데이터, 경고 목록을 포함합니다.")
    private SurveyAiResultResponse aiResult;
}

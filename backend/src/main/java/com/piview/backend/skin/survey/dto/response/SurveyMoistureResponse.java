package com.piview.backend.skin.survey.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "수분 분석 결과 DTO")
public class SurveyMoistureResponse {

    @JsonProperty("cheek_mean_score")
    @Schema(description = "양볼 평균 수분 회귀 점수입니다. 서비스 해석 전의 원점수이며, 디버깅과 운영 검증용으로 함께 제공합니다.", example = "62.0024")
    private Double cheekMeanScore;

    @Schema(description = "서비스 기준으로 해석한 수분 상태입니다. low면 수분 부족, normal이면 정상으로 봅니다.", example = "normal")
    private String state;
}

package com.piview.backend.domain.skin.survey.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "건성/지성 축 분석 결과 DTO")
public class SurveyAxisResponse {

    @Schema(description = "대표 축입니다. dry_side면 건성 경향, oily_side면 지성 경향을 뜻합니다.", example = "oily_side")
    private String axis;

    @JsonProperty("display_dry_probability")
    @Schema(description = "프론트 표시용 건성 퍼센트입니다. 원시 확률이 아니라 화면 표시를 위해 0~100 기준으로 정리된 값입니다.", example = "37.8")
    private Double displayDryProbability;

    @JsonProperty("display_oily_probability")
    @Schema(description = "프론트 표시용 지성 퍼센트입니다. 원시 확률이 아니라 화면 표시를 위해 0~100 기준으로 정리된 값입니다.", example = "62.2")
    private Double displayOilyProbability;
}

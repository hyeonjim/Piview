package com.piview.backend.domain.skin.survey.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "부위별 ROI 집합 DTO")
public class SurveyRoisResponse {

    @Schema(description = "이마 ROI")
    private SurveyRoiAreaResponse forehead;

    @JsonProperty("left_cheek")
    @Schema(description = "좌측 볼 ROI")
    private SurveyRoiAreaResponse leftCheek;

    @JsonProperty("right_cheek")
    @Schema(description = "우측 볼 ROI")
    private SurveyRoiAreaResponse rightCheek;
}

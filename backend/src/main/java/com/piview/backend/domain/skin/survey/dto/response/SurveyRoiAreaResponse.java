package com.piview.backend.domain.skin.survey.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "개별 ROI 영역 DTO")
public class SurveyRoiAreaResponse {

    @Schema(description = "정규화된 bounding box 좌표")
    private SurveyRoiBboxResponse bbox;
}

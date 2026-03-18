package com.piview.backend.skin.survey.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "ROI bounding box 좌표 DTO")
public class SurveyRoiBboxResponse {

    @Schema(description = "좌상단 x 좌표(0~1 정규화)", example = "0.250786")
    private Double x1;

    @Schema(description = "좌상단 y 좌표(0~1 정규화)", example = "0.404481")
    private Double y1;

    @Schema(description = "우하단 x 좌표(0~1 정규화)", example = "0.507469")
    private Double x2;

    @Schema(description = "우하단 y 좌표(0~1 정규화)", example = "0.5398")
    private Double y2;
}

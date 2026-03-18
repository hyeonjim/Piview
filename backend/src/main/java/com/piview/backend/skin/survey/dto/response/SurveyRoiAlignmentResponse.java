package com.piview.backend.skin.survey.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "얼굴 정렬 메타데이터 DTO")
public class SurveyRoiAlignmentResponse {

    @JsonProperty("rotate_deg")
    @Schema(description = "ROI 계산 전 원본 얼굴을 얼마나 회전 보정했는지 나타내는 각도", example = "1.0887")
    private Double rotateDeg;

    @JsonProperty("flipped_180")
    @Schema(description = "180도 뒤집기 보정이 적용되었는지 여부", example = "false")
    private Boolean flipped180;
}

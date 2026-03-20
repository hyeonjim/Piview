package com.piview.backend.domain.skin.survey.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "ROI 좌표 메타데이터 DTO")
public class SurveyRoiMetadataResponse {

    @JsonProperty("coordinate_space")
    @Schema(description = "ROI 좌표계 종류. 현재는 원본 이미지 기준 정규화 좌표(original_normalized)입니다.", example = "original_normalized")
    private String coordinateSpace;

    @JsonProperty("image_size")
    @Schema(description = "원본 이미지 크기")
    private SurveyRoiImageSizeResponse imageSize;

    @Schema(description = "얼굴 정렬 과정 메타데이터")
    private SurveyRoiAlignmentResponse alignment;

    @Schema(description = "부위별 ROI 박스 집합")
    private SurveyRoisResponse rois;
}

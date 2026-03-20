package com.piview.backend.domain.skin.survey.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "원본 이미지 크기 DTO")
public class SurveyRoiImageSizeResponse {

    @Schema(description = "원본 이미지 너비(px)", example = "2544")
    private Integer width;

    @Schema(description = "원본 이미지 높이(px)", example = "3392")
    private Integer height;
}

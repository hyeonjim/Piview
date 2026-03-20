package com.piview.backend.domain.skin.survey.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "부위별 피부 타입 분석 결과 DTO")
public class SurveyRegionalSkinTypeResponse {

    @Schema(description = "이마 부위 분석 결과입니다. 보통 T존 유분 경향을 가장 잘 보여주는 값입니다.")
    private SurveyAxisResponse forehead;

    @JsonProperty("left_cheek")
    @Schema(description = "좌측 볼 부위 분석 결과입니다. 볼 건조 경향이나 좌우 비대칭을 확인할 때 참고합니다.")
    private SurveyAxisResponse leftCheek;

    @JsonProperty("right_cheek")
    @Schema(description = "우측 볼 부위 분석 결과입니다. 볼 건조 경향이나 좌우 비대칭을 확인할 때 참고합니다.")
    private SurveyAxisResponse rightCheek;

    @JsonProperty("cheek_mean_axis")
    @Schema(description = "좌우 볼 결과를 종합한 평균 축입니다. 볼 전체를 대표하는 건성/지성 경향으로 해석합니다.", example = "dry_side")
    private String cheekMeanAxis;

    @JsonProperty("display_dry_probability")
    @Schema(description = "좌우 볼 평균 기준 표시용 건성 퍼센트", example = "65.78")
    private Double displayDryProbability;

    @JsonProperty("display_oily_probability")
    @Schema(description = "좌우 볼 평균 기준 표시용 지성 퍼센트", example = "34.22")
    private Double displayOilyProbability;

    @JsonProperty("regional_difference_exists")
    @Schema(description = "이마/볼 등 부위별 결과 차이가 존재하는지 여부입니다. true면 부위별 피부 경향이 섞여 있다는 뜻입니다.", example = "true")
    private Boolean regionalDifferenceExists;

    @JsonProperty("forehead_oily_cheek_dry")
    @Schema(description = "이마는 지성 쪽이고 볼 평균은 건성 쪽인지 여부입니다. 전형적인 복합성(T존 유분, U존 건조) 패턴 확인용입니다.", example = "true")
    private Boolean foreheadOilyCheekDry;
}

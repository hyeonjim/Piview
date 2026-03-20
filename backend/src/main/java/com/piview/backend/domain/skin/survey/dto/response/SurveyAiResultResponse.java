package com.piview.backend.domain.skin.survey.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "최종 제출 응답에 포함되는 AI 분석 결과 요약 DTO")
public class SurveyAiResultResponse {

    @JsonProperty("global_face")
    @Schema(description = "얼굴 전체(global face)를 한 번에 본 대표 축 결과입니다. 이마/볼 같은 부위별 상세 결과와는 별도로, 얼굴 전체가 건성 쪽인지 지성 쪽인지 요약합니다.")
    private SurveyAxisResponse globalFace;

    @JsonProperty("regional_skin_type")
    @Schema(description = "이마/좌볼/우볼 단위의 부위별 피부 타입 분석 결과입니다. 복합성 여부나 T존/볼 차이를 해석할 때 주로 사용합니다.")
    private SurveyRegionalSkinTypeResponse regionalSkinType;

    @Schema(description = "양볼 기준 수분 분석 결과입니다. 현재는 점수와 서비스 해석 상태(low/normal)를 함께 제공합니다.")
    private SurveyMoistureResponse moisture;

    @JsonProperty("roi_metadata")
    @Schema(description = "프론트 오버레이 표시용 ROI 좌표 메타데이터입니다. 원본 이미지 위에 이마/볼 박스를 그릴 때 사용합니다.")
    private SurveyRoiMetadataResponse roiMetadata;

    @Schema(description = "분석 중 비치명적으로 발생한 경고 목록입니다. 값이 비어 있으면 별도 경고가 없다는 뜻입니다.")
    private List<SurveyWarningResponse> warnings;
}

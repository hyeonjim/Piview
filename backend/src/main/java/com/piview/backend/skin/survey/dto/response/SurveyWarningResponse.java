package com.piview.backend.skin.survey.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "AI 분석 경고 DTO")
public class SurveyWarningResponse {

    @Schema(description = "경고가 발생한 처리 단계", example = "mediapipe_roi")
    private String stage;

    @Schema(description = "사용자/운영에서 참고할 경고 상세 메시지", example = "MediaPipe ROI 추출 실패: 얼굴을 찾지 못했습니다.")
    private String detail;
}

package com.piview.backend.skin.analysis.dto.response;

import com.piview.backend.skin.analysis.entity.SkinAnalysisStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "피부 분석 시작 응답 DTO입니다. capture 직후에는 항상 PENDING 상태를 반환합니다.")
public class SkinAnalysisCaptureResponse {

    // 프론트가 이후 상태 조회에 사용할 비동기 작업 식별자입니다.
    @Schema(description = "상태 조회와 최종 설문 제출에 사용할 피부 분석 작업 식별자", example = "35e9064f-7c69-48ee-be1f-5a4a600ad88d")
    private String analysisId;

    // capture 직후에는 항상 PENDING으로 응답합니다.
    @Schema(description = "피부 분석 작업의 현재 상태입니다. capture 응답에서는 항상 PENDING입니다.", implementation = SkinAnalysisStatus.class, example = "PENDING")
    private SkinAnalysisStatus status;
}

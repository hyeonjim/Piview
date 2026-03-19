package com.piview.backend.skin.analysis.entity;

import io.swagger.v3.oas.annotations.media.Schema;

// Redis에 저장하는 피부 분석 작업의 현재 상태값입니다.
@Schema(description = "피부 분석 비동기 작업 상태값")
public enum SkinAnalysisStatus {
    @Schema(description = "요청은 접수되었고 AI 분석이 아직 진행 중인 상태")
    PENDING,
    @Schema(description = "AI 분석이 정상 완료된 상태")
    COMPLETED,
    @Schema(description = "AI 분석 또는 후처리 중 오류가 발생한 상태")
    FAILED
}

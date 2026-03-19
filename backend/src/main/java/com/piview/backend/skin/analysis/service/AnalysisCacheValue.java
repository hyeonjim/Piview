package com.piview.backend.skin.analysis.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.piview.backend.skin.analysis.entity.SkinAnalysisStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
class AnalysisCacheValue {

    // Redis에 저장되는 피부 분석 상태 문서입니다.
    // PENDING이면 상태만 있고, COMPLETED면 result가 채워지며, FAILED면 errorMessage가 채워집니다.
    private String analysisId;
    private Long userId;
    private SkinAnalysisStatus status;
    // 최종 설문이 이미 한 번 처리됐는지 표시하는 플래그입니다.
    private Boolean consumed;
    private JsonNode result;
    private String errorMessage;

    // 분석 시작 직후 상태
    static AnalysisCacheValue pending(String analysisId, Long userId) {
        return AnalysisCacheValue.builder()
                .analysisId(analysisId)
                .userId(userId)
                .status(SkinAnalysisStatus.PENDING)
                .consumed(false)
                .build();
    }

    // FastAPI 응답을 받은 뒤 저장하는 완료 상태
    static AnalysisCacheValue completed(String analysisId, Long userId, JsonNode result) {
        return AnalysisCacheValue.builder()
                .analysisId(analysisId)
                .userId(userId)
                .status(SkinAnalysisStatus.COMPLETED)
                .consumed(false)
                .result(result)
                .build();
    }

    // 타임아웃이나 예외가 발생했을 때 저장하는 실패 상태
    static AnalysisCacheValue failed(String analysisId, Long userId, String errorMessage) {
        return AnalysisCacheValue.builder()
                .analysisId(analysisId)
                .userId(userId)
                .status(SkinAnalysisStatus.FAILED)
                .consumed(false)
                .errorMessage(errorMessage)
                .build();
    }
}

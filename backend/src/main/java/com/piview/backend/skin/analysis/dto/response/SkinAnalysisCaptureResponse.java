package com.piview.backend.skin.analysis.dto.response;

import com.piview.backend.skin.analysis.SkinAnalysisStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SkinAnalysisCaptureResponse {

    // 프론트가 이후 상태 조회에 사용할 비동기 작업 식별자입니다.
    private String analysisId;

    // capture 직후에는 항상 PENDING으로 응답합니다.
    private SkinAnalysisStatus status;
}

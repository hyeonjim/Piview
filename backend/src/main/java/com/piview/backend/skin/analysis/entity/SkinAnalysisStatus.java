package com.piview.backend.skin.analysis.entity;

// Redis에 저장하는 피부 분석 작업의 현재 상태값입니다.
public enum SkinAnalysisStatus {
    PENDING,
    COMPLETED,
    FAILED
}

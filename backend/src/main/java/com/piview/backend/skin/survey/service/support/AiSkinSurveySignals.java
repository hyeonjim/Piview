package com.piview.backend.skin.survey.service.support;

// SurveyScoreCalculator 가 AI 원본 JSON 구조를 직접 알지 않도록,
// 최종 판정에 필요한 신호만 서비스 계층에서 한 번 평탄화한 값 객체다.
// 이 레코드에 필드를 추가하면 설문 계산 규칙도 함께 확장할 수 있다.
public record AiSkinSurveySignals(
    String globalAxis,
    boolean regionalDifferenceExists,
    boolean foreheadOilyCheekDry,
    double cheekMeanScore,
    boolean cheekMeanMoistureLow
) {
}

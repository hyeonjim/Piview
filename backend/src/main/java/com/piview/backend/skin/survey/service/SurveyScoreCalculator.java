package com.piview.backend.skin.survey.service;

import java.util.EnumMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.piview.backend.skin.survey.entity.SurveyChoice;
import com.piview.backend.skin.survey.entity.SurveySkinType;
import com.piview.backend.skin.survey.service.support.AiSkinSurveySignals;

@Component
public class SurveyScoreCalculator {

    // 원본 장비 측정값 분포와 validation 결과를 기준으로 현재 서비스에서 쓰는 수분 부족 기준.
    private static final double CHEEK_MEAN_MOISTURE_LOW_THRESHOLD = 56.0;
    private static final String DRY_SIDE = "dry_side";
    private static final String OILY_SIDE = "oily_side";

    public SurveySkinType calculateSkinType(
        SurveyChoice question3,
        SurveyChoice question4,
        SurveyChoice question5,
        SurveyChoice question6,
        AiSkinSurveySignals aiSignals
    ) {
        // 문항 3~6은 설문 점수의 기본 골격을 만들고,
        // AI 신호는 global/regional/moisture 를 보조 가중치로 붙이는 구조다.
        validateQuestions(question3, question4, question5, question6, aiSignals);

        Map<SurveySkinType, Integer> scoreMap = new EnumMap<>(SurveySkinType.class);
        for (SurveySkinType type : SurveySkinType.values()) {
            scoreMap.put(type, 0);
        }

        applyQuestion3(scoreMap, question3);
        applyQuestion4(scoreMap, question4);
        applyQuestion5(scoreMap, question5);
        applyQuestion6(scoreMap, question6);

        // 최종 점수는 문서 합의대로 설문 점수를 기본값으로 두고
        // AI는 타입을 완전히 뒤집기보다는 특정 방향으로 보정하는 정도로만 가중한다.
        int dryFinalScore = scoreMap.get(SurveySkinType.DRY) * 2
            + (DRY_SIDE.equals(aiSignals.globalAxis()) ? 2 : 0)
            + (aiSignals.cheekMeanMoistureLow() ? 1 : 0);
        int combinationFinalScore = scoreMap.get(SurveySkinType.COMBINATION) * 2
            + (aiSignals.regionalDifferenceExists() ? 1 : 0);
        int oilyFinalScore = scoreMap.get(SurveySkinType.OILY) * 2
            + (OILY_SIDE.equals(aiSignals.globalAxis()) ? 2 : 0);
        int dehydratedOilyFinalScore = scoreMap.get(SurveySkinType.DEHYDRATED_OILY)
            + (isQuestion5Affirmative(question5) ? 2 : 0)
            + (OILY_SIDE.equals(aiSignals.globalAxis()) ? 2 : 0)
            + (aiSignals.cheekMeanMoistureLow() ? 1 : 0);

        Map<SurveySkinType, Integer> finalScoreMap = new EnumMap<>(SurveySkinType.class);
        finalScoreMap.put(SurveySkinType.DRY, dryFinalScore);
        finalScoreMap.put(SurveySkinType.COMBINATION, combinationFinalScore);
        finalScoreMap.put(SurveySkinType.OILY, oilyFinalScore);
        finalScoreMap.put(SurveySkinType.DEHYDRATED_OILY, dehydratedOilyFinalScore);

        return resolveTie(finalScoreMap, question5, aiSignals);
    }

    private void validateQuestions(
        SurveyChoice question3,
        SurveyChoice question4,
        SurveyChoice question5,
        SurveyChoice question6,
        AiSkinSurveySignals aiSignals
    ) {
        // 설문 문항이 비어 있으면 계산 규칙 자체가 무의미해지므로 초기에 막는다.
        if (question3 == null || question4 == null || question5 == null || question6 == null || aiSignals == null) {
            throw new IllegalArgumentException("문항 3~6의 응답은 모두 필수입니다.");
        }
    }

    private void applyQuestion3(Map<SurveySkinType, Integer> scoreMap, SurveyChoice question3) {
        // Q3: 세안 직후 당김/유분 체감 문항.
        // 문서 기준으로 건성/복합성/수부지 초기 점수에 직접 반영한다.
        switch (question3) {
            case A -> increaseScore(scoreMap, SurveySkinType.DRY, 2);
            case B -> { }
            case C -> increaseScore(scoreMap, SurveySkinType.COMBINATION, 1);
            case D -> {
                increaseScore(scoreMap, SurveySkinType.DRY, 1);
                increaseScore(scoreMap, SurveySkinType.DEHYDRATED_OILY, 1);
            }
        }
    }

    private void applyQuestion4(Map<SurveySkinType, Integer> scoreMap, SurveyChoice question4) {
        // Q4: 시간 경과 후 번들거림과 부위 차이 문항.
        // 복합성/지성 분리에 특히 영향을 주는 질문이라 가중치를 크게 둔다.
        switch (question4) {
            case A -> increaseScore(scoreMap, SurveySkinType.DRY, 1);
            case B -> { }
            case C -> increaseScore(scoreMap, SurveySkinType.COMBINATION, 2);
            case D -> increaseScore(scoreMap, SurveySkinType.OILY, 2);
        }
    }

    private void applyQuestion5(Map<SurveySkinType, Integer> scoreMap, SurveyChoice question5) {
        // Q5: 속당김/겉번들 같은 수부지 성향 문항.
        // 수부지 판단과 tie-break 에서 가장 중요한 설문 신호다.
        switch (question5) {
            case A -> increaseScore(scoreMap, SurveySkinType.DEHYDRATED_OILY, 2);
            case B -> increaseScore(scoreMap, SurveySkinType.DEHYDRATED_OILY, 1);
            case C -> increaseScore(scoreMap, SurveySkinType.OILY, 1);
            case D -> { }
        }
    }

    private void applyQuestion6(Map<SurveySkinType, Integer> scoreMap, SurveyChoice question6) {
        // Q6: 모공/번들/균일성 관련 보조 문항.
        // 지성/복합성 보정에 쓰되, 단독으로 타입을 결정하지는 않도록 가중치를 제한한다.
        switch (question6) {
            case A -> increaseScore(scoreMap, SurveySkinType.DRY, 1);
            case B -> increaseScore(scoreMap, SurveySkinType.OILY, 2);
            case C -> {
                increaseScore(scoreMap, SurveySkinType.OILY, 1);
                increaseScore(scoreMap, SurveySkinType.COMBINATION, 1);
            }
            case D -> increaseScore(scoreMap, SurveySkinType.COMBINATION, 2);
        }
    }

    private void increaseScore(Map<SurveySkinType, Integer> scoreMap, SurveySkinType type, int score) {
        // 모든 가중치는 이 헬퍼로만 누적해 규칙 변경 시 추적 지점을 단순화한다.
        scoreMap.put(type, scoreMap.get(type) + score);
    }

    private SurveySkinType resolveTie(
        Map<SurveySkinType, Integer> finalScoreMap,
        SurveyChoice question5,
        AiSkinSurveySignals aiSignals
    ) {
        // 동점 해소는 "Q5에서 속당김을 강하게 호소하는지"와
        // "이마 지성 + 볼 건조 / 수분 부족" 같은 AI 보조 신호를 우선 사용한다.
        int maxScore = finalScoreMap.values().stream()
            .mapToInt(Integer::intValue)
            .max()
            .orElseThrow(() -> new IllegalStateException("피부 타입 점수 계산에 실패했습니다."));

        boolean dryTied = finalScoreMap.get(SurveySkinType.DRY) == maxScore;
        boolean combinationTied = finalScoreMap.get(SurveySkinType.COMBINATION) == maxScore;
        boolean oilyTied = finalScoreMap.get(SurveySkinType.OILY) == maxScore;
        boolean dehydratedOilyTied = finalScoreMap.get(SurveySkinType.DEHYDRATED_OILY) == maxScore;

        if (dehydratedOilyTied && !isQuestion5Affirmative(question5)) {
            // Q5가 수부지 성향을 지지하지 않으면 수부지는 동점 후보에서 먼저 제외한다.
            dehydratedOilyTied = false;
        }

        if (oilyTied && dehydratedOilyTied) {
            // 지성과 수부지가 붙으면 "이마 지성 + 볼 건조" 또는 "수분 부족" 신호가 있는 쪽을 수부지로 본다.
            return aiSignals.foreheadOilyCheekDry() || aiSignals.cheekMeanMoistureLow()
                ? SurveySkinType.DEHYDRATED_OILY
                : SurveySkinType.OILY;
        }

        if (dryTied && oilyTied && !combinationTied && !dehydratedOilyTied) {
            // 건성/지성만 정면 충돌하면 얼굴 전체 축(global axis)으로 마지막 결정을 내린다.
            return DRY_SIDE.equals(aiSignals.globalAxis()) ? SurveySkinType.DRY : SurveySkinType.OILY;
        }

        if (isQuestion5Affirmative(question5)) {
            // Q5가 속건조 쪽이면 동점 상황에서도 건성/복합성/수부지를 먼저 검토한다.
            if (dehydratedOilyTied) {
                return SurveySkinType.DEHYDRATED_OILY;
            }
            if (combinationTied) {
                return SurveySkinType.COMBINATION;
            }
            if (dryTied) {
                return SurveySkinType.DRY;
            }
            if (oilyTied) {
                return SurveySkinType.OILY;
            }
        }

        if (combinationTied) {
            return SurveySkinType.COMBINATION;
        }
        if (dryTied) {
            return SurveySkinType.DRY;
        }
        if (oilyTied) {
            return SurveySkinType.OILY;
        }
        if (dehydratedOilyTied) {
            return SurveySkinType.DEHYDRATED_OILY;
        }

        throw new IllegalStateException("피부 타입 동점 해소에 실패했습니다.");
    }

    boolean isCheekMeanMoistureLow(double cheekMeanScore) {
        // moisture 모델은 회귀값만 반환하므로, 최종 서비스에서는 이 threshold 이하를 low 로 해석한다.
        return cheekMeanScore <= CHEEK_MEAN_MOISTURE_LOW_THRESHOLD;
    }

    private boolean isQuestion5Affirmative(SurveyChoice question5) {
        // 문서 기준으로 Q5의 A/B 선택지는 속당김/수분 부족을 직접 호소하는 응답으로 본다.
        return question5 == SurveyChoice.A || question5 == SurveyChoice.B;
    }
}

package com.piview.backend.skin.survey.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.piview.backend.domain.skin.survey.service.SurveyScoreCalculator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.piview.backend.domain.skin.survey.entity.SurveyChoice;
import com.piview.backend.domain.skin.survey.entity.SurveySkinType;
import com.piview.backend.domain.skin.survey.service.support.AiSkinSurveySignals;

class SurveyScoreCalculatorTest {

    private final SurveyScoreCalculator surveyScoreCalculator = new SurveyScoreCalculator();
    private static final AiSkinSurveySignals DRY_COMBINATION_SIGNALS =
        new AiSkinSurveySignals("dry_side", true, false, 72.0, false);
    private static final AiSkinSurveySignals OILY_LOW_MOISTURE_SIGNALS =
        new AiSkinSurveySignals("oily_side", false, true, 50.0, true);

    @Test
    @DisplayName("AI regional 차이 신호가 있으면 복합성이 우선 계산된다.")
    void calculateSkinTypeReturnsHighestScoreType() {
        SurveySkinType result = surveyScoreCalculator.calculateSkinType(
            SurveyChoice.B,
            SurveyChoice.B,
            SurveyChoice.D,
            SurveyChoice.C,
            DRY_COMBINATION_SIGNALS
        );

        assertEquals(SurveySkinType.COMBINATION, result);
    }

    @Test
    @DisplayName("Q5가 A 또는 B이고 수분 low면 수부지 점수가 강화된다.")
    void calculateSkinTypeReturnsDehydratedOilyWhenMoistureAndQuestion5SupportIt() {
        SurveySkinType result = surveyScoreCalculator.calculateSkinType(
            SurveyChoice.D,
            SurveyChoice.B,
            SurveyChoice.A,
            SurveyChoice.C,
            OILY_LOW_MOISTURE_SIGNALS
        );

        assertEquals(SurveySkinType.DEHYDRATED_OILY, result);
    }

    @Test
    @DisplayName("문항 3~6 중 하나라도 null이면 예외가 발생한다.")
    void calculateSkinTypeThrowsWhenQuestionIsNull() {
        assertThrows(
            IllegalArgumentException.class,
            () -> surveyScoreCalculator.calculateSkinType(
                null,
                SurveyChoice.A,
                SurveyChoice.B,
                SurveyChoice.C,
                DRY_COMBINATION_SIGNALS
            )
        );
    }
}

package com.piview.backend.skin.survey.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.piview.backend.skin.survey.entity.SurveyChoice;
import com.piview.backend.skin.survey.entity.SurveySkinType;

class SurveyScoreCalculatorTest {

    private final SurveyScoreCalculator surveyScoreCalculator = new SurveyScoreCalculator();

    @Test
    @DisplayName("점수가 가장 높은 타입을 반환한다.")
    void calculateSkinTypeReturnsHighestScoreType() {
        SurveySkinType result = surveyScoreCalculator.calculateSkinType(
            SurveyChoice.B,
            SurveyChoice.B,
            SurveyChoice.B,
            SurveyChoice.C
        );

        assertEquals(SurveySkinType.COMBINATION, result);
    }

    @Test
    @DisplayName("동점이면 문항 5 응답으로 우선 판정한다.")
    void calculateSkinTypeResolvesTieByQuestion5First() {
        SurveySkinType result = surveyScoreCalculator.calculateSkinType(
            SurveyChoice.A,
            SurveyChoice.B,
            SurveyChoice.D,
            SurveyChoice.C
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
                SurveyChoice.C
            )
        );
    }
}

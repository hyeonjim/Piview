package com.piview.backend.skin.survey.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SurveyAgeGroup {
    TEENS(10, "10대"),
    TWENTIES(20, "20대"),
    THIRTIES(30, "30대"),
    FORTIES_PLUS(40, "40대 이상");

    private final int code;
    private final String label;
}

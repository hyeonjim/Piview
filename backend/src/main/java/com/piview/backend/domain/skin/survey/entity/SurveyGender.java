package com.piview.backend.domain.skin.survey.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SurveyGender {
    MEN("남성"),
    WOMEN("여성");

    private final String label;
}

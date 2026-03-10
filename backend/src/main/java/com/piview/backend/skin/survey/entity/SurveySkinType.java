package com.piview.backend.skin.survey.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SurveySkinType {
    DRY("건성"),
    OILY("지성"),
    COMBINATION("복합성"),
    DEHYDRATED_OILY("수부지");

    private final String label;
}

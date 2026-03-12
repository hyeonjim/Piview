package com.piview.backend.skin.survey.dto.request;

import com.piview.backend.skin.survey.entity.SurveyAgeGroup;
import com.piview.backend.skin.survey.entity.SurveyChoice;
import com.piview.backend.skin.survey.entity.SurveyGender;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class SurveySubmitRequest {

    @NotNull
    private SurveyGender gender;

    @NotNull
    private SurveyAgeGroup ageGroup;

    // Q3~Q6은 설문 명세에 따라 A/B/C/D 고정 선택값을 사용한다.
    @NotNull
    private SurveyChoice question3;

    @NotNull
    private SurveyChoice question4;

    @NotNull
    private SurveyChoice question5;

    @NotNull
    private SurveyChoice question6;

    // Q7은 다중 선택 문항이다.
    @NotEmpty
    private List<String> skinProblems;
}

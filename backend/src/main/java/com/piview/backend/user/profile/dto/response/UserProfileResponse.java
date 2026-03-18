package com.piview.backend.user.profile.dto.response;

import java.util.List;

import com.piview.backend.skin.survey.entity.SurveyAgeGroup;
import com.piview.backend.skin.survey.entity.SurveyGender;
import com.piview.backend.skin.survey.entity.SurveySkinType;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserProfileResponse {

    private String name;
    private String email;
    private SurveyGender gender;
    private SurveyAgeGroup ageGroup;
    private SurveySkinType mySkinType;
    private List<String> skinProblems;
}

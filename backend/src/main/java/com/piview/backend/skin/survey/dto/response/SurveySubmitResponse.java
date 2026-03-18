package com.piview.backend.skin.survey.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import com.piview.backend.skin.survey.entity.SurveySkinType;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class SurveySubmitResponse {

    private String analysisId;
    private SurveySkinType mySkinType;
    private List<String> skinProblems;
    private JsonNode aiResult;
}

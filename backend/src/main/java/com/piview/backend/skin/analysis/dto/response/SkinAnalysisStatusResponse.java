package com.piview.backend.skin.analysis.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.piview.backend.skin.analysis.entity.SkinAnalysisStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SkinAnalysisStatusResponse {

    private String analysisId;
    private SkinAnalysisStatus status;
    private JsonNode result;
    private String errorMessage;
}

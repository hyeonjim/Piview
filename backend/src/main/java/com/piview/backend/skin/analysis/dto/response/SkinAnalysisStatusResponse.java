package com.piview.backend.skin.analysis.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.piview.backend.skin.analysis.entity.SkinAnalysisStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "피부 분석 상태 조회 응답 DTO입니다. status는 PENDING, COMPLETED, FAILED 중 하나이며, errorMessage는 FAILED일 때만 내려갑니다.")
public class SkinAnalysisStatusResponse {

    @Schema(description = "조회한 피부 분석 작업 식별자", example = "35e9064f-7c69-48ee-be1f-5a4a600ad88d")
    private String analysisId;

    @Schema(description = "피부 분석 작업의 현재 상태", implementation = SkinAnalysisStatus.class, example = "COMPLETED")
    private SkinAnalysisStatus status;

    @Schema(description = "실패한 경우에만 내려주는 에러 메시지입니다. PENDING이나 COMPLETED 상태에서는 null입니다.", example = "AI 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.", nullable = true)
    private String errorMessage;
}

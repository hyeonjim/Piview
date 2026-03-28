package com.piview.backend.domain.routine.analysis.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@Schema(description = "루틴 AI 분석 요청 - 화면에 보이는 제품 ID 목록을 넘겨주세요.")
public class RoutineAnalysisRequest {

    @NotEmpty(message = "분석할 제품이 없습니다.")
    @Schema(description = "분석할 제품 ID 목록", example = "[123, 456, 789]")
    private List<Long> productIds;
}

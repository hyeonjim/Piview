package com.piview.backend.domain.routine.analysis.controller;

import com.piview.backend.domain.routine.analysis.dto.response.RoutineAnalysisResponse;
import com.piview.backend.domain.routine.analysis.service.RoutineAnalysisFacadeService;
import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.CompletableFuture;

@Tag(name = "루틴 분석 API", description = "메인 루틴에 대한 AI 기반 성분 분석 및 피부 맞춤 조언 API")
@RestController
@RequestMapping("/routines/analysis")
@RequiredArgsConstructor
public class RoutineAnalysisController {

    private final RoutineAnalysisFacadeService routineAnalysisFacadeService;

    @Operation(
            summary = "메인 루틴 AI 분석",
            description = "사용자의 메인 루틴을 기반으로 카테고리별 이상치 달성도, 성분 충돌 경고, 루틴 순서 팁, 추가 추천 성분 등을 5줄 이내로 분석합니다."
    )
    @GetMapping
    public CompletableFuture<ApiResponse<RoutineAnalysisResponse>> analyzeMainRoutine(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return routineAnalysisFacadeService.analyzeMainRoutine(userPrincipal.getId())
                .thenApply(response -> ApiResponse.success("루틴 분석을 성공적으로 불러왔습니다.", response));
    }
}

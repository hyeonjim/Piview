package com.piview.backend.domain.routine.analysis.controller;

import com.piview.backend.domain.routine.analysis.dto.request.RoutineAnalysisRequest;
import com.piview.backend.domain.routine.analysis.dto.response.RoutineAnalysisResponse;
import com.piview.backend.domain.routine.analysis.service.RoutineAnalysisFacadeService;
import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.CompletableFuture;

@Tag(name = "루틴 분석 API", description = "현재 화면에 보이는 루틴 제품들에 대한 AI 기반 분석 API")
@RestController
@RequestMapping("/routines/analysis")
@RequiredArgsConstructor
public class RoutineAnalysisController {

    private final RoutineAnalysisFacadeService routineAnalysisFacadeService;

    @Operation(
            summary = "루틴 AI 분석",
            description = """
                    화면에 보이는 제품 ID 목록을 받아 AI 루틴 분석을 수행합니다.
                    - 저장된 루틴 보기 중: 해당 루틴의 productId 목록
                    - 편집/새 루틴 작성 중: 현재 Draft의 productId 목록
                    성분 충돌, 이상치 달성도, 피부 고민 커버 여부, 제품 추천 등을 5줄 이내로 분석합니다.
                    """
    )
    @PostMapping
    public CompletableFuture<ApiResponse<RoutineAnalysisResponse>> analyzeRoutine(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody RoutineAnalysisRequest request
    ) {
        return routineAnalysisFacadeService.analyzeRoutine(userPrincipal.getId(), request.getProductIds())
                .thenApply(response -> ApiResponse.success("루틴 분석을 성공적으로 불러왔습니다.", response));
    }
}

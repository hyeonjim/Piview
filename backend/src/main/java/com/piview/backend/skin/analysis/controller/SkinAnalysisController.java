package com.piview.backend.skin.analysis.controller;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.skin.analysis.dto.response.SkinAnalysisCaptureResponse;
import com.piview.backend.skin.analysis.dto.response.SkinAnalysisStatusResponse;
import com.piview.backend.skin.analysis.service.SkinAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/skin/analysis")
@RequiredArgsConstructor
public class SkinAnalysisController {

    private final SkinAnalysisService skinAnalysisService;

    // 사진 업로드와 동시에 분석 작업을 시작하고, 조회용 analysisId만 먼저 반환합니다.
    @PostMapping(value = "/capture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<SkinAnalysisCaptureResponse> captureAnalysis(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam("image") MultipartFile image
    ) {
        return ApiResponse.success(skinAnalysisService.captureAnalysis(userPrincipal.getId(), image));
    }

    // analysisId 기준으로 현재 분석 상태나 완료 결과를 조회합니다.
    @GetMapping("/{analysisId}")
    public ApiResponse<SkinAnalysisStatusResponse> getAnalysisStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String analysisId
    ) {
        return ApiResponse.success(skinAnalysisService.getAnalysisStatus(userPrincipal.getId(), analysisId));
    }
}

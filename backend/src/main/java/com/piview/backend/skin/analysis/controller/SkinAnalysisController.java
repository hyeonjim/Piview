package com.piview.backend.skin.analysis.controller;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.skin.analysis.dto.response.SkinAnalysisCaptureResponse;
import com.piview.backend.skin.analysis.dto.response.SkinAnalysisStatusResponse;
import com.piview.backend.skin.analysis.service.SkinAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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

@Tag(name = "피부 분석 API", description = "카메라 캡처 이미지 기반 피부 분석 시작 및 상태 조회 API입니다.")
@RestController
@RequestMapping("/skin/analysis")
@RequiredArgsConstructor
public class SkinAnalysisController {

    private final SkinAnalysisService skinAnalysisService;

    // 사진 업로드와 동시에 분석 작업을 시작하고, 조회용 analysisId만 먼저 반환합니다.
    @Operation(
            summary = "피부 분석 시작",
            description = "얼굴 이미지 1장을 업로드하면 비동기 피부 분석 작업을 시작합니다. 응답에는 바로 analysisId와 PENDING 상태를 반환하고, 실제 AI 분석은 백그라운드에서 진행됩니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "피부 분석 시작 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "이미지 파일이 없거나 잘못된 요청", content = @Content(schema = @Schema(hidden = true))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 실패", content = @Content(schema = @Schema(hidden = true))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content(schema = @Schema(hidden = true)))
    })
    @PostMapping(value = "/capture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<SkinAnalysisCaptureResponse> captureAnalysis(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Parameter(
                    description = "분석할 얼굴 이미지 파일 1장입니다. multipart/form-data 형식의 image 필드로 전달합니다.",
                    required = true
            )
            @RequestParam("image") MultipartFile image
    ) {
        return ApiResponse.success(skinAnalysisService.captureAnalysis(userPrincipal.getId(), image));
    }

    // analysisId 기준으로 현재 분석 상태나 완료 결과를 조회합니다.
    @Operation(
            summary = "피부 분석 상태 조회",
            description = "analysisId 기준으로 현재 피부 분석 작업 상태를 조회합니다. 이 API는 상태 확인만 담당하며, 최종 피부 진단 계산은 이후 surveys API에서 처리합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "상태 조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 실패", content = @Content(schema = @Schema(hidden = true))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "다른 사용자의 analysisId 접근", content = @Content(schema = @Schema(hidden = true))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "analysisId를 찾을 수 없음", content = @Content(schema = @Schema(hidden = true)))
    })
    @GetMapping("/{analysisId}")
    public ApiResponse<SkinAnalysisStatusResponse> getAnalysisStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Parameter(description = "capture API에서 발급받은 비동기 분석 작업 식별자입니다.", example = "35e9064f-7c69-48ee-be1f-5a4a600ad88d")
            @PathVariable String analysisId
    ) {
        return ApiResponse.success(skinAnalysisService.getAnalysisStatus(userPrincipal.getId(), analysisId));
    }
}

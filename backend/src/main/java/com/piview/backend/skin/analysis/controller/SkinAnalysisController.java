package com.piview.backend.skin.analysis.controller;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.skin.analysis.dto.response.SkinAnalysisCaptureResponse;
import com.piview.backend.skin.analysis.dto.response.SkinAnalysisStatusResponse;
import com.piview.backend.skin.analysis.service.SkinAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
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
            description = "얼굴 이미지 1장을 `multipart/form-data`의 `image` 필드로 업로드하면 비동기 피부 분석 작업을 시작합니다. 이 API는 작업 시작만 담당하며, 응답에는 즉시 analysisId와 PENDING 상태를 반환합니다. 실제 AI 분석 완료 여부와 실패 여부는 이후 상태 조회 API에서 확인합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "피부 분석 시작 성공",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = SkinAnalysisCaptureResponse.class),
                            examples = @ExampleObject(
                                    name = "CaptureStarted",
                                    summary = "비동기 분석 시작 직후 응답",
                                    value = "{\"status\":200,\"message\":\"요청에 성공했습니다.\",\"data\":{\"analysisId\":\"35e9064f-7c69-48ee-be1f-5a4a600ad88d\",\"status\":\"PENDING\"}}"
                            )
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "이미지 파일이 없거나 손상된 경우",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    name = "InvalidImageFile",
                                    summary = "image 파일이 비어 있거나 누락된 경우",
                                    value = "{\"status\":400,\"error\":\"BAD_REQUEST\",\"code\":\"INVALID_IMAGE_FILE\",\"message\":\"이미지 파일이 비어있거나 손상되었습니다.\"}"
                            )
                    )
            ),
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
            description = "analysisId 기준으로 현재 피부 분석 작업 상태를 조회합니다. 상태는 `PENDING`, `COMPLETED`, `FAILED` 중 하나이며, `FAILED`일 때만 errorMessage가 채워집니다. 이 API는 상태 확인만 담당하며, 최종 피부 진단 저장은 이후 surveys API에서 처리합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "상태 조회 성공",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = SkinAnalysisStatusResponse.class),
                            examples = {
                                    @ExampleObject(
                                            name = "PendingStatus",
                                            summary = "분석 진행 중",
                                            value = "{\"status\":200,\"message\":\"요청에 성공했습니다.\",\"data\":{\"analysisId\":\"35e9064f-7c69-48ee-be1f-5a4a600ad88d\",\"status\":\"PENDING\"}}"
                                    ),
                                    @ExampleObject(
                                            name = "CompletedStatus",
                                            summary = "분석 완료",
                                            value = "{\"status\":200,\"message\":\"요청에 성공했습니다.\",\"data\":{\"analysisId\":\"35e9064f-7c69-48ee-be1f-5a4a600ad88d\",\"status\":\"COMPLETED\"}}"
                                    ),
                                    @ExampleObject(
                                            name = "FailedStatus",
                                            summary = "분석 실패",
                                            value = "{\"status\":200,\"message\":\"요청에 성공했습니다.\",\"data\":{\"analysisId\":\"35e9064f-7c69-48ee-be1f-5a4a600ad88d\",\"status\":\"FAILED\",\"errorMessage\":\"AI 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.\"}}"
                                    )
                            }
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 실패", content = @Content(schema = @Schema(hidden = true))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "다른 사용자의 analysisId 접근",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    name = "SkinAnalysisAccessDenied",
                                    summary = "본인 소유가 아닌 analysisId 조회",
                                    value = "{\"status\":403,\"error\":\"FORBIDDEN\",\"code\":\"SKIN_ANALYSIS_ACCESS_DENIED\",\"message\":\"본인의 피부 분석만 확인할 수 있습니다.\"}"
                            )
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "analysisId를 찾을 수 없음",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    name = "SkinAnalysisNotFound",
                                    summary = "존재하지 않거나 만료된 analysisId",
                                    value = "{\"status\":404,\"error\":\"NOT_FOUND\",\"code\":\"SKIN_ANALYSIS_NOT_FOUND\",\"message\":\"해당 피부 분석 결과를 찾을 수 없습니다.\"}"
                            )
                    )
            )
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

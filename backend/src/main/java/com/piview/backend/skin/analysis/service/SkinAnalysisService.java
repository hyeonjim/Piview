package com.piview.backend.skin.analysis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.skin.analysis.dto.response.SkinAnalysisCaptureResponse;
import com.piview.backend.skin.analysis.dto.response.SkinAnalysisStatusResponse;
import com.piview.backend.skin.analysis.entity.SkinAnalysisStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SkinAnalysisService {

    private final SkinAnalysisCacheService skinAnalysisCacheService;
    private final SkinAnalysisAiClient skinAnalysisAiClient;

    // 이미지 업로드를 받으면 analysisId를 발급하고 바로 PENDING 상태를 반환합니다.
    public SkinAnalysisCaptureResponse captureAnalysis(Long userId, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_IMAGE_FILE);
        }

        // analysisId는 이후 상태 조회의 기준 키가 됩니다.
        String analysisId = UUID.randomUUID().toString();
        byte[] imageBytes = extractImageBytes(image);
        String fileName = image.getOriginalFilename() == null ? analysisId + ".jpg" : image.getOriginalFilename();

        // 조회 요청이 바로 들어와도 상태를 읽을 수 있게 먼저 PENDING을 저장합니다.
        skinAnalysisCacheService.savePending(analysisId, userId);

        // 실제 AI 추론은 별도 비동기 작업에서 진행합니다.
        CompletableFuture.runAsync(() -> requestAnalysisAndCache(analysisId, userId, imageBytes, fileName));

        return SkinAnalysisCaptureResponse.builder()
                .analysisId(analysisId)
                .status(SkinAnalysisStatus.PENDING)
                .build();
    }

    // analysisId에 연결된 Redis 상태 문서를 읽어 현재 상태를 반환합니다.
    public SkinAnalysisStatusResponse getAnalysisStatus(Long userId, String analysisId) {
        JsonNode cachedState = skinAnalysisCacheService.getAnalysisState(analysisId);
        skinAnalysisCacheService.validateOwner(cachedState, userId);

        // 상태 조회 API는 진행 상태 확인만 담당하고, 실제 분석 결과는 이후 surveys API에서 사용합니다.
        return SkinAnalysisStatusResponse.builder()
                .analysisId(cachedState.path("analysisId").asText())
                .status(SkinAnalysisStatus.valueOf(cachedState.path("status").asText()))
                .errorMessage(readNullableText(cachedState, "errorMessage"))
                .build();
    }

    // 비동기 작업에서 안정적으로 재사용할 수 있도록 업로드 파일을 바이트 배열로 고정합니다.
    private byte[] extractImageBytes(MultipartFile image) {
        try {
            return image.getBytes();
        } catch (IOException e) {
            throw new CustomException(ErrorCode.INVALID_IMAGE_FILE);
        }
    }

    private String readNullableText(JsonNode cachedState, String fieldName) {
        JsonNode node = cachedState.get(fieldName);
        return node == null || node.isNull() ? null : node.asText();
    }

    // FastAPI 호출 결과에 따라 Redis 상태를 COMPLETED 또는 FAILED로 갱신합니다.
    private void requestAnalysisAndCache(String analysisId, Long userId, byte[] imageBytes, String fileName) {
        try {
            // FastAPI 응답 본문은 이후 surveys API에서 재사용할 수 있게 캐시에 함께 저장합니다.
            JsonNode response = skinAnalysisAiClient.requestSkinAnalysis(imageBytes, fileName);
            skinAnalysisCacheService.saveCompleted(analysisId, userId, response);
        } catch (RestClientException e) {
            log.error("❌ 피부 분석 FastAPI 통신 실패. analysisId={}", analysisId, e);
            skinAnalysisCacheService.saveFailed(analysisId, userId, ErrorCode.AI_SERVER_TIMEOUT.getMessage());
        } catch (Exception e) {
            log.error("❌ 피부 분석 비동기 처리 실패. analysisId={}", analysisId, e);
            skinAnalysisCacheService.saveFailed(analysisId, userId, ErrorCode.INTERNAL_SERVER_ERROR.getMessage());
        }
    }
}

package com.piview.backend.skin.analysis.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.global.redis.RedisService;
import com.piview.backend.skin.analysis.dto.response.SkinAnalysisCaptureResponse;
import com.piview.backend.skin.analysis.dto.response.SkinAnalysisStatusResponse;
import com.piview.backend.skin.analysis.entity.SkinAnalysisStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SkinAnalysisService {

    // 분석 결과는 Redis에 일정 시간만 유지합니다.
    private static final Duration ANALYSIS_TTL = Duration.ofMinutes(30);
    private static final String ANALYSIS_KEY_PREFIX = "skin:analysis:";

    private final RedisService redisService;
    private final ObjectMapper objectMapper;

    @Value("${fastapi.base-url}")
    private String fastApiBaseUrl;

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
        storeAnalysisState(AnalysisCacheValue.pending(analysisId, userId));

        // 실제 AI 추론은 별도 비동기 작업에서 진행합니다.
        CompletableFuture.runAsync(() -> requestAnalysisAndCache(analysisId, userId, imageBytes, fileName));

        return SkinAnalysisCaptureResponse.builder()
                .analysisId(analysisId)
                .status(SkinAnalysisStatus.PENDING)
                .build();
    }

    // analysisId에 연결된 Redis 상태 문서를 읽어 현재 상태를 반환합니다.
    public SkinAnalysisStatusResponse getAnalysisStatus(Long userId, String analysisId) {
        JsonNode cachedState = readAnalysisState(analysisId);
        validateAnalysisOwner(cachedState, userId);

        return SkinAnalysisStatusResponse.builder()
                .analysisId(cachedState.path("analysisId").asText())
                .status(SkinAnalysisStatus.valueOf(cachedState.path("status").asText()))
                .result(cachedState.get("result"))
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

    // Redis 문자열을 JsonNode로 읽어 상태 조회 응답에 재사용합니다.
    private JsonNode readAnalysisState(String analysisId) {
        String key = ANALYSIS_KEY_PREFIX + analysisId;
        String payload = redisService.getValues(key);

        if (payload == null || payload.isBlank()) {
            throw new CustomException(ErrorCode.SKIN_ANALYSIS_NOT_FOUND);
        }

        try {
            return objectMapper.readTree(payload);
        } catch (IOException e) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    // 다른 사용자의 analysisId를 그대로 조회하지 못하도록 userId를 한 번 더 확인합니다.
    private void validateAnalysisOwner(JsonNode cachedState, Long userId) {
        long ownerUserId = cachedState.path("userId").asLong(-1L);
        if (ownerUserId != userId) {
            throw new CustomException(ErrorCode.SKIN_ANALYSIS_ACCESS_DENIED);
        }
    }

    private String readNullableText(JsonNode cachedState, String fieldName) {
        JsonNode node = cachedState.get(fieldName);
        return node == null || node.isNull() ? null : node.asText();
    }

    // FastAPI 호출 결과에 따라 Redis 상태를 COMPLETED 또는 FAILED로 갱신합니다.
    private void requestAnalysisAndCache(String analysisId, Long userId, byte[] imageBytes, String fileName) {
        try {
            // FastAPI 응답 본문은 조회 API에서 그대로 내려줄 수 있게 함께 저장합니다.
            JsonNode response = requestSkinAnalysis(imageBytes, fileName);
            storeAnalysisState(AnalysisCacheValue.completed(analysisId, userId, response));
        } catch (RestClientException e) {
            log.error("❌ 피부 분석 FastAPI 통신 실패. analysisId={}", analysisId, e);
            storeAnalysisState(AnalysisCacheValue.failed(analysisId, userId, ErrorCode.AI_SERVER_TIMEOUT.getMessage()));
        } catch (Exception e) {
            log.error("❌ 피부 분석 비동기 처리 실패. analysisId={}", analysisId, e);
            storeAnalysisState(AnalysisCacheValue.failed(analysisId, userId, ErrorCode.INTERNAL_SERVER_ERROR.getMessage()));
        }
    }

    // FastAPI /skin/predict 에 multipart/form-data 형태로 이미지를 전달합니다.
    // AI 응답은 JsonNode로 받아 Redis에 그대로 저장합니다.
    private JsonNode requestSkinAnalysis(byte[] imageBytes, String fileName) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", createImageResource(imageBytes, fileName));

        // OCR와 같은 방식으로 multipart 요청을 구성합니다.
        JsonNode response = buildRestClient().post()
                .uri(fastApiBaseUrl + "/skin/predict")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        if (response == null) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
        return response;
    }

    // 디스크에 임시 저장하지 않고 메모리에서 바로 multipart 리소스를 만듭니다.
    private ByteArrayResource createImageResource(byte[] imageBytes, String fileName) {
        // 파일명까지 함께 넘겨야 FastAPI 쪽 파일 처리와 자연스럽게 맞습니다.
        return new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };
    }

    // FastAPI 호출에 사용할 RestClient입니다.
    private RestClient buildRestClient() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(3000);
        requestFactory.setReadTimeout(20000);

        return RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    // analysisId 기준 JSON 문서 하나를 Redis에 저장합니다.
    private void storeAnalysisState(AnalysisCacheValue value) {
        try {
            // status 조회 API에서는 이 값을 그대로 읽어 사용합니다.
            String key = ANALYSIS_KEY_PREFIX + value.getAnalysisId();
            String payload = objectMapper.writeValueAsString(value);
            redisService.setValues(key, payload, ANALYSIS_TTL);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private static class AnalysisCacheValue {

        // Redis에 저장되는 비동기 분석 상태 문서입니다.
        // PENDING이면 result가 없고, COMPLETED면 result가 채워지며, FAILED면 errorMessage가 채워집니다.
        private String analysisId;
        private Long userId;
        private SkinAnalysisStatus status;
        private JsonNode result;
        private String errorMessage;

        // 분석 시작 직후 상태
        private static AnalysisCacheValue pending(String analysisId, Long userId) {
            return AnalysisCacheValue.builder()
                    .analysisId(analysisId)
                    .userId(userId)
                    .status(SkinAnalysisStatus.PENDING)
                    .build();
        }

        // FastAPI 응답을 받은 뒤 저장하는 완료 상태
        private static AnalysisCacheValue completed(String analysisId, Long userId, JsonNode result) {
            return AnalysisCacheValue.builder()
                    .analysisId(analysisId)
                    .userId(userId)
                    .status(SkinAnalysisStatus.COMPLETED)
                    .result(result)
                    .build();
        }

        // 타임아웃이나 예외가 발생했을 때 저장하는 실패 상태
        private static AnalysisCacheValue failed(String analysisId, Long userId, String errorMessage) {
            return AnalysisCacheValue.builder()
                    .analysisId(analysisId)
                    .userId(userId)
                    .status(SkinAnalysisStatus.FAILED)
                    .errorMessage(errorMessage)
                    .build();
        }
    }
}

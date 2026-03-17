package com.piview.backend.skin.analysis.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.global.redis.RedisService;
import com.piview.backend.skin.analysis.SkinAnalysisStatus;
import com.piview.backend.skin.analysis.dto.response.SkinAnalysisCaptureResponse;
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

    // 분석 결과는 영구 저장 대신 Redis에만 잠시 유지합니다.
    private static final Duration ANALYSIS_TTL = Duration.ofMinutes(30);
    private static final String ANALYSIS_KEY_PREFIX = "skin:analysis:";

    private final RedisService redisService;
    private final ObjectMapper objectMapper;

    @Value("${fastapi.base-url}")
    private String fastApiBaseUrl;

    public SkinAnalysisCaptureResponse captureAnalysis(Long userId, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_IMAGE_FILE);
        }

        // capture 시점에는 DB를 쓰지 않고 UUID 하나만 발급해서 Redis 상태 추적의 키로 사용합니다.
        String analysisId = UUID.randomUUID().toString();
        byte[] imageBytes = extractImageBytes(image);
        String fileName = image.getOriginalFilename() == null ? analysisId + ".jpg" : image.getOriginalFilename();

        // 프론트가 바로 상태 조회를 시작할 수 있도록 먼저 PENDING을 적재합니다.
        storeAnalysisState(AnalysisCacheValue.pending(analysisId, userId));

        // FastAPI 호출은 요청-응답을 오래 붙잡지 않도록 별도 비동기 작업으로 실행합니다.
        CompletableFuture.runAsync(() -> requestAnalysisAndCache(analysisId, userId, imageBytes, fileName));

        return SkinAnalysisCaptureResponse.builder()
                .analysisId(analysisId)
                .status(SkinAnalysisStatus.PENDING)
                .build();
    }

    private byte[] extractImageBytes(MultipartFile image) {
        try {
            return image.getBytes();
        } catch (IOException e) {
            throw new CustomException(ErrorCode.INVALID_IMAGE_FILE);
        }
    }

    private void requestAnalysisAndCache(String analysisId, Long userId, byte[] imageBytes, String fileName) {
        try {
            // FastAPI 분석이 끝나면 응답 본문 전체를 Redis에 함께 저장합니다.
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

    private JsonNode requestSkinAnalysis(byte[] imageBytes, String fileName) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", createImageResource(imageBytes, fileName));

        // OCR와 같은 방식으로 multipart 요청을 구성해 기존 FastAPI /skin/predict를 호출합니다.
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

    private ByteArrayResource createImageResource(byte[] imageBytes, String fileName) {
        // Multipart 전송 시 파일명까지 함께 넘겨야 FastAPI 쪽 파일 검증 로직과 자연스럽게 맞습니다.
        return new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };
    }

    private RestClient buildRestClient() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(3000);
        requestFactory.setReadTimeout(20000);

        return RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    private void storeAnalysisState(AnalysisCacheValue value) {
        try {
            // analysisId 기준 단일 JSON 문서로 저장해 추후 status 조회 API에서 그대로 읽을 수 있게 둡니다.
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

        // Redis에 저장되는 비동기 분석 작업의 최소 상태 문서입니다.
        private String analysisId;
        private Long userId;
        private SkinAnalysisStatus status;
        private JsonNode result;
        private String errorMessage;

        private static AnalysisCacheValue pending(String analysisId, Long userId) {
            return AnalysisCacheValue.builder()
                    .analysisId(analysisId)
                    .userId(userId)
                    .status(SkinAnalysisStatus.PENDING)
                    .build();
        }

        private static AnalysisCacheValue completed(String analysisId, Long userId, JsonNode result) {
            return AnalysisCacheValue.builder()
                    .analysisId(analysisId)
                    .userId(userId)
                    .status(SkinAnalysisStatus.COMPLETED)
                    .result(result)
                    .build();
        }

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

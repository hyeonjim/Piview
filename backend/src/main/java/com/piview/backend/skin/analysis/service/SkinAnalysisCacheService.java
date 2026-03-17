package com.piview.backend.skin.analysis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.global.redis.RedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class SkinAnalysisCacheService {

    // 분석 결과는 Redis에 일정 시간만 유지합니다.
    private static final Duration ANALYSIS_TTL = Duration.ofMinutes(30);
    private static final String ANALYSIS_KEY_PREFIX = "skin:analysis:";

    private final RedisService redisService;
    private final ObjectMapper objectMapper;

    public void savePending(String analysisId, Long userId) {
        storeAnalysisState(AnalysisCacheValue.pending(analysisId, userId));
    }

    public void saveCompleted(String analysisId, Long userId, JsonNode result) {
        storeAnalysisState(AnalysisCacheValue.completed(analysisId, userId, result));
    }

    public void saveFailed(String analysisId, Long userId, String errorMessage) {
        storeAnalysisState(AnalysisCacheValue.failed(analysisId, userId, errorMessage));
    }

    // Redis 문자열을 JsonNode로 읽어 이후 상태 조회나 최종 설문 계산에 재사용합니다.
    public JsonNode getAnalysisState(String analysisId) {
        String payload = redisService.getValues(buildKey(analysisId));

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
    public void validateOwner(JsonNode cachedState, Long userId) {
        long ownerUserId = cachedState.path("userId").asLong(-1L);
        if (ownerUserId != userId) {
            throw new CustomException(ErrorCode.SKIN_ANALYSIS_ACCESS_DENIED);
        }
    }

    private void storeAnalysisState(AnalysisCacheValue value) {
        try {
            String payload = objectMapper.writeValueAsString(value);
            redisService.setValues(buildKey(value.getAnalysisId()), payload, ANALYSIS_TTL);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    private String buildKey(String analysisId) {
        return ANALYSIS_KEY_PREFIX + analysisId;
    }
}

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

    // capture 직후 상태를 먼저 저장해 두면, 프론트가 바로 status API를 호출해도 진행 중 상태를 확인할 수 있습니다.
    public void savePending(String analysisId, Long userId) {
        storeAnalysisState(AnalysisCacheValue.pending(analysisId, userId));
    }

    // AI 응답 원본은 이후 surveys API에서 재사용할 예정이라 status와 함께 그대로 캐시에 보관합니다.
    public void saveCompleted(String analysisId, Long userId, JsonNode result) {
        storeAnalysisState(AnalysisCacheValue.completed(analysisId, userId, result));
    }

    // 비동기 작업 실패도 같은 analysisId 문서에 덮어써서 프론트가 동일한 조회 흐름으로 실패 상태를 확인하게 합니다.
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

    // Redis에는 analysisId별 JSON 문서 하나만 저장하고, 상태 변화에 따라 같은 키를 계속 덮어씁니다.
    private void storeAnalysisState(AnalysisCacheValue value) {
        try {
            String payload = objectMapper.writeValueAsString(value);
            redisService.setValues(buildKey(value.getAnalysisId()), payload, ANALYSIS_TTL);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    // key 규칙은 고정 prefix + analysisId 형태로 유지해 조회 경로를 단순하게 맞춥니다.
    private String buildKey(String analysisId) {
        return ANALYSIS_KEY_PREFIX + analysisId;
    }
}

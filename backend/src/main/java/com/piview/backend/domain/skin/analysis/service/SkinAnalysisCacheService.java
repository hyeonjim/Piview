package com.piview.backend.domain.skin.analysis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.global.redis.RedisService;
import com.piview.backend.domain.skin.analysis.entity.SkinAnalysisStatus;
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
    // 최종 설문 제출 중복 처리를 막기 위한 락 키 prefix
    private static final String SUBMIT_LOCK_KEY_PREFIX = "lock:skin:survey:";
    private static final Duration SUBMIT_LOCK_TTL = Duration.ofSeconds(30);

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

    public void validateReadyForSurveySubmission(JsonNode cachedState) {
        SkinAnalysisStatus status;
        try {
            status = SkinAnalysisStatus.valueOf(cachedState.path("status").asText(""));
        } catch (IllegalArgumentException exception) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }

        // 최종 설문은 "AI 분석 성공 + 아직 미소비" 상태에서만 허용한다.
        // 여기서 막아두면 프론트가 잘못된 analysisId를 보내도 서비스 로직이 오염되지 않는다.
        if (status == SkinAnalysisStatus.PENDING) {
            throw new CustomException(ErrorCode.SKIN_ANALYSIS_NOT_COMPLETED);
        }
        if (status == SkinAnalysisStatus.FAILED) {
            throw new CustomException(ErrorCode.SKIN_ANALYSIS_FAILED);
        }
        if (cachedState.path("consumed").asBoolean(false)) {
            throw new CustomException(ErrorCode.SKIN_ANALYSIS_ALREADY_CONSUMED);
        }
        if (cachedState.path("result").isMissingNode() || cachedState.path("result").isNull()) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    public boolean tryAcquireSurveySubmitLock(String analysisId) {
        // 짧은 락 키를 따로 두어 동시 제출만 막고, 원본 분석 문서는 그대로 유지한다.
        return redisService.setValuesIfAbsent(buildSubmitLockKey(analysisId), "locked", SUBMIT_LOCK_TTL);
    }

    public void releaseSurveySubmitLock(String analysisId) {
        redisService.deleteValues(buildSubmitLockKey(analysisId));
    }

    public void markConsumed(JsonNode cachedState) {
        if (!(cachedState instanceof ObjectNode objectNode)) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }

        // 최종 제출이 끝난 analysisId는 삭제하지 않고 consumed=true 로 남겨
        // 같은 분석 결과가 다시 제출되지 않도록 합니다.
        objectNode.put("consumed", true);
        try {
            String payload = objectMapper.writeValueAsString(objectNode);
            redisService.setValues(buildKey(objectNode.path("analysisId").asText()), payload, ANALYSIS_TTL);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
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

    private String buildSubmitLockKey(String analysisId) {
        return SUBMIT_LOCK_KEY_PREFIX + analysisId;
    }
}

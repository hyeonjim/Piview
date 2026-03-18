package com.piview.backend.skin.survey.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.skin.analysis.service.SkinAnalysisCacheService;
import com.piview.backend.skin.survey.dto.request.SurveySubmitRequest;
import com.piview.backend.skin.survey.dto.response.SurveySubmitResponse;
import com.piview.backend.skin.survey.entity.MySkin;
import com.piview.backend.skin.survey.entity.SurveyAgeGroup;
import com.piview.backend.skin.survey.entity.SurveySkinType;
import com.piview.backend.skin.survey.repository.MySkinRepository;
import com.piview.backend.skin.survey.service.support.AiSkinSurveySignals;
import com.piview.backend.user.entity.User;
import com.piview.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SurveyService {

    private final UserRepository userRepository;
    private final MySkinRepository mySkinRepository;
    private final SurveyScoreCalculator surveyScoreCalculator;
    private final SurveySkinProblemMapper surveySkinProblemMapper;
    private final SkinAnalysisCacheService skinAnalysisCacheService;

    // 최종 설문 제출의 오케스트레이션 담당:
    // 1) Redis analysisId 검증
    // 2) AI 신호 추출
    // 3) 설문 + AI 결합 계산
    // 4) 사용자 프로필 / 피부 고민 저장
    // 5) consumed 처리와 응답용 AI 결과 정리
    @Transactional
    public SurveySubmitResponse submitSurvey(Long userId, String analysisId, SurveySubmitRequest request) {
        // 같은 analysisId로 프론트가 중복 클릭하거나 네트워크 재시도로 두 번 들어와도
        // 동시에 최종 제출이 처리되지 않도록 Redis 락으로 먼저 입구를 막는다.
        if (!skinAnalysisCacheService.tryAcquireSurveySubmitLock(analysisId)) {
            throw new CustomException(ErrorCode.SKIN_SURVEY_SUBMIT_IN_PROGRESS);
        }

        boolean releaseLockImmediately = true;
        try {
            // capture 단계에서 저장해둔 분석 결과 문서를 Redis에서 다시 읽는다.
            // 최종 설문은 이 analysisId가 있어야만 설문 응답과 AI 결과를 결합할 수 있다.
            JsonNode cachedState = skinAnalysisCacheService.getAnalysisState(analysisId);
            // analysisId를 다른 사용자가 재사용하지 못하도록 소유권을 한 번 더 검증한다.
            skinAnalysisCacheService.validateOwner(cachedState, userId);
            // 아직 분석 중이거나 이미 실패/소비된 결과라면 최종 제출을 막는다.
            skinAnalysisCacheService.validateReadyForSurveySubmission(cachedState);

            User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

            // Redis에 저장된 AI 원본 JSON에서 최종 피부타입 계산에 필요한 신호만 추출한다.
            AiSkinSurveySignals aiSignals = extractAiSignals(cachedState.path("result"));
            SurveySkinType mySkinType = calculateSkinType(request, aiSignals);
            // Q7 원문은 프론트 문구이고, DB에는 서비스에서 쓰는 내부 태그 문자열로 저장한다.
            // 여기에 연령대(40대 이상) 기반 파생 태그도 함께 합친다.
            List<String> mappedSkinProblems = addDerivedSkinProblems(
                surveySkinProblemMapper.mapToTags(request.getSkinProblems()),
                request.getAgeGroup()
            );

            // 사용자 프로필에는 최종 피부타입과 설문 기본 정보만 반영한다.
            user.updateSurveyProfile(request.getGender(), request.getAgeGroup(), mySkinType);
            // 최종 피부 고민 태그는 최신 설문 1세트만 유지하기 위해 기존 값을 지우고 다시 저장한다.
            mySkinRepository.deleteAllByUserId(userId);
            mySkinRepository.saveAll(createMySkins(userId, mappedSkinProblems));
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    // DB 반영이 실제로 커밋된 뒤에만 consumed=true 로 바꿔야
                    // 롤백된 요청이 잘못 소비 처리되는 일을 막을 수 있다.
                    skinAnalysisCacheService.markConsumed(cachedState);
                }

                @Override
                public void afterCompletion(int status) {
                    // 성공/실패와 무관하게 락은 항상 정리한다.
                    skinAnalysisCacheService.releaseSurveySubmitLock(analysisId);
                }
            });
            releaseLockImmediately = false;

            return SurveySubmitResponse.builder()
                .analysisId(analysisId)
                .mySkinType(mySkinType)
                .skinProblems(mappedSkinProblems)
                .aiResult(buildClientAiResult(cachedState.path("result")))
                .build();
        } finally {
            if (releaseLockImmediately) {
                skinAnalysisCacheService.releaseSurveySubmitLock(analysisId);
            }
        }
    }

    private SurveySkinType calculateSkinType(SurveySubmitRequest request, AiSkinSurveySignals aiSignals) {
        try {
            // 점수 계산 규칙은 SurveyScoreCalculator 에 모아두고,
            // 서비스는 요청/AI 신호를 그 계산기로 전달하는 역할만 맡는다.
            return surveyScoreCalculator.calculateSkinType(
                request.getQuestion3(),
                request.getQuestion4(),
                request.getQuestion5(),
                request.getQuestion6(),
                aiSignals
            );
        } catch (IllegalArgumentException exception) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
    }

    private AiSkinSurveySignals extractAiSignals(JsonNode aiResult) {
        if (aiResult.isMissingNode() || aiResult.isNull()) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }

        // global_face.axis 는 건성/지성 큰 축을 정하는 핵심 신호다.
        String globalAxis = aiResult.path("global_face").path("axis").asText("");
        // regional_skin_type 쪽 boolean 들은 최종 타입이 복합성/수부지 쪽으로 기울 수 있는지 판단할 때 쓴다.
        boolean regionalDifferenceExists = aiResult.path("regional_skin_type")
            .path("regional_difference_exists")
            .asBoolean(false);
        boolean foreheadOilyCheekDry = aiResult.path("regional_skin_type")
            .path("forehead_oily_cheek_dry")
            .asBoolean(false);
        JsonNode moistureNode = aiResult.path("moisture");
        // 수분 모델은 현재 회귀 점수만 주므로, 최종 규칙에서는 threshold 비교로 low 여부를 해석한다.
        double cheekMeanScore = moistureNode.path("cheek_mean_score").asDouble(Double.NaN);

        if (globalAxis.isBlank() || Double.isNaN(cheekMeanScore)) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }

        return new AiSkinSurveySignals(
            globalAxis,
            regionalDifferenceExists,
            foreheadOilyCheekDry,
            cheekMeanScore,
            surveyScoreCalculator.isCheekMeanMoistureLow(cheekMeanScore)
        );
    }

    private List<String> addDerivedSkinProblems(List<String> mappedSkinProblems, SurveyAgeGroup ageGroup) {
        LinkedHashSet<String> derivedProblems = new LinkedHashSet<>(mappedSkinProblems);

        // 설문 문서 기준으로 "40대 이상"은 안티에이징 관심사로 자동 반영한다.
        // Q7 입력값에 "노화방지-40대이상" 같은 별도 문자열을 받지 않는 이유가 이 규칙 때문이다.
        if (ageGroup == SurveyAgeGroup.FORTIES_PLUS) {
            derivedProblems.add("안티에이징");
        }

        return new ArrayList<>(derivedProblems);
    }

    private List<MySkin> createMySkins(Long userId, List<String> skinProblems) {
        // 최종 저장 시점에는 피부 고민을 별도 엔티티 묶음으로 만들어 bulk insert 한다.
        return skinProblems.stream()
            .map(skinProblem -> MySkin.builder()
                .userId(userId)
                .skinProblem(skinProblem)
                .build())
            .toList();
    }

    private JsonNode buildClientAiResult(JsonNode aiResult) {
        // Redis에는 원본 AI 응답을 보존하고, 최종 제출 응답에서는 프론트가 바로 쓰기 좋게 한 번 정리해서 내린다.
        JsonNode copied = aiResult.deepCopy();
        stripInternalProbabilities(copied);
        enrichMoistureState(copied);
        return copied;
    }

    private void stripInternalProbabilities(JsonNode node) {
        if (node == null || node.isNull() || node.isValueNode()) {
            return;
        }

        if (node.isArray()) {
            // warnings 같은 배열 안에 객체가 들어올 수 있어 재귀적으로 같은 규칙을 적용한다.
            ArrayNode arrayNode = (ArrayNode) node;
            arrayNode.forEach(this::stripInternalProbabilities);
            return;
        }

        ObjectNode objectNode = (ObjectNode) node;
        // raw probability 는 내부 디버깅/검증에는 유용하지만 프론트 표시에는 중복이라 제거한다.
        // 화면에는 axis 와 display_* 만 내려가도록 응답을 얇게 만든다.
        objectNode.remove(List.of(
            "dry_probability",
            "oily_probability",
            "cheek_mean_dry_probability",
            "cheek_mean_oily_probability"
        ));
        objectNode.elements().forEachRemaining(this::stripInternalProbabilities);
    }

    private void enrichMoistureState(JsonNode aiResult) {
        JsonNode moistureNode = aiResult.path("moisture");
        if (!(moistureNode instanceof ObjectNode moistureObject)) {
            // moisture 추론 실패 시에는 이 노드가 null 일 수 있으므로 조용히 빠진다.
            return;
        }

        double cheekMeanScore = moistureObject.path("cheek_mean_score").asDouble(Double.NaN);
        if (Double.isNaN(cheekMeanScore)) {
            return;
        }

        // 수분은 현재 score 그대로 노출하되, 프론트가 별도 기준식을 몰라도 되도록
        // 우리가 해석한 결과 문자열(state)을 함께 내려준다.
        boolean isLow = surveyScoreCalculator.isCheekMeanMoistureLow(cheekMeanScore);
        moistureObject.put("state", isLow ? "low" : "normal");
    }
}

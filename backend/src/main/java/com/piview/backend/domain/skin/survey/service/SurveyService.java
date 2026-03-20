package com.piview.backend.domain.skin.survey.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.fasterxml.jackson.databind.JsonNode;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.domain.skin.analysis.service.SkinAnalysisCacheService;
import com.piview.backend.domain.skin.common.SkinTypeEnum;
import com.piview.backend.domain.skin.survey.dto.request.SurveySubmitRequest;
import com.piview.backend.domain.skin.survey.dto.response.SurveyAiResultResponse;
import com.piview.backend.domain.skin.survey.dto.response.SurveyAxisResponse;
import com.piview.backend.domain.skin.survey.dto.response.SurveyMoistureResponse;
import com.piview.backend.domain.skin.survey.dto.response.SurveyRegionalSkinTypeResponse;
import com.piview.backend.domain.skin.survey.dto.response.SurveyRoiAlignmentResponse;
import com.piview.backend.domain.skin.survey.dto.response.SurveyRoiAreaResponse;
import com.piview.backend.domain.skin.survey.dto.response.SurveyRoiBboxResponse;
import com.piview.backend.domain.skin.survey.dto.response.SurveyRoiImageSizeResponse;
import com.piview.backend.domain.skin.survey.dto.response.SurveyRoiMetadataResponse;
import com.piview.backend.domain.skin.survey.dto.response.SurveyRoisResponse;
import com.piview.backend.domain.skin.survey.dto.response.SurveySubmitResponse;
import com.piview.backend.domain.skin.survey.dto.response.SurveyWarningResponse;
import com.piview.backend.domain.skin.survey.entity.MySkin;
import com.piview.backend.domain.skin.survey.entity.SurveyAgeGroup;
import com.piview.backend.domain.skin.survey.repository.MySkinRepository;
import com.piview.backend.domain.skin.survey.service.support.AiSkinSurveySignals;
import com.piview.backend.domain.user.login.entity.User;
import com.piview.backend.domain.user.login.repository.UserRepository;

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
            SkinTypeEnum mySkinType = calculateSkinType(request, aiSignals);
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

    private SkinTypeEnum calculateSkinType(SurveySubmitRequest request, AiSkinSurveySignals aiSignals) {
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

    private SurveyAiResultResponse buildClientAiResult(JsonNode aiResult) {
        // Redis에는 원본 AI 응답을 보존하고, 최종 제출 응답에서는 프론트가 바로 쓰기 좋은 DTO로 정리해 내린다.
        // 이 메서드는 "응답 스키마를 안정적으로 유지하는 진입점" 역할을 한다.
        // 즉 Redis 원본 JSON 구조가 일부 바뀌더라도, 프론트 계약은 여기서 최대한 흡수한다.
        return SurveyAiResultResponse.builder()
            .globalFace(buildAxisResponse(aiResult.path("global_face")))
            .regionalSkinType(buildRegionalSkinTypeResponse(aiResult.path("regional_skin_type")))
            .moisture(buildMoistureResponse(aiResult.path("moisture")))
            .roiMetadata(buildRoiMetadataResponse(aiResult.path("roi_metadata")))
            .warnings(buildWarningResponses(aiResult.path("warnings")))
            .build();
    }

    private SurveyAxisResponse buildAxisResponse(JsonNode node) {
        if (node.isMissingNode() || node.isNull()) {
            return null;
        }

        // global_face 와 forehead/left_cheek/right_cheek 모두 같은 축 구조를 쓰므로
        // 공통 변환 메서드로 묶어 display 확률만 노출한다.
        return SurveyAxisResponse.builder()
            .axis(node.path("axis").asText(null))
            .displayDryProbability(readNullableDouble(node, "display_dry_probability"))
            .displayOilyProbability(readNullableDouble(node, "display_oily_probability"))
            .build();
    }

    private SurveyRegionalSkinTypeResponse buildRegionalSkinTypeResponse(JsonNode node) {
        if (node.isMissingNode() || node.isNull()) {
            return null;
        }

        // regional_skin_type 는 이마/좌볼/우볼 개별 결과와,
        // 좌우 볼 평균, 부위 차이 존재 여부, 전형적인 복합성 패턴 여부까지 포함하는 요약 노드다.
        return SurveyRegionalSkinTypeResponse.builder()
            .forehead(buildAxisResponse(node.path("forehead")))
            .leftCheek(buildAxisResponse(node.path("left_cheek")))
            .rightCheek(buildAxisResponse(node.path("right_cheek")))
            .cheekMeanAxis(node.path("cheek_mean_axis").asText(null))
            .displayDryProbability(readNullableDouble(node, "display_dry_probability"))
            .displayOilyProbability(readNullableDouble(node, "display_oily_probability"))
            .regionalDifferenceExists(readNullableBoolean(node, "regional_difference_exists"))
            .foreheadOilyCheekDry(readNullableBoolean(node, "forehead_oily_cheek_dry"))
            .build();
    }

    private SurveyMoistureResponse buildMoistureResponse(JsonNode node) {
        if (node.isMissingNode() || node.isNull()) {
            return null;
        }

        // moisture 모델은 아직 회귀 점수만 반환하므로,
        // 서비스 기준 threshold 로 low/normal 상태를 한 번 더 해석해 함께 내려준다.
        Double cheekMeanScore = readNullableDouble(node, "cheek_mean_score");
        if (cheekMeanScore == null) {
            return null;
        }

        boolean isLow = surveyScoreCalculator.isCheekMeanMoistureLow(cheekMeanScore);
        return SurveyMoistureResponse.builder()
            .cheekMeanScore(cheekMeanScore)
            .state(isLow ? "low" : "normal")
            .build();
    }

    private SurveyRoiMetadataResponse buildRoiMetadataResponse(JsonNode node) {
        if (node.isMissingNode() || node.isNull()) {
            return null;
        }

        // ROI 메타데이터는 프론트 오버레이 표시용이다.
        // image_size / alignment / rois 를 나눠서 담아두면, 좌표계가 바뀌더라도 설명과 확장이 쉽다.
        JsonNode imageSize = node.path("image_size");
        JsonNode alignment = node.path("alignment");
        JsonNode rois = node.path("rois");

        return SurveyRoiMetadataResponse.builder()
            .coordinateSpace(node.path("coordinate_space").asText(null))
            .imageSize(SurveyRoiImageSizeResponse.builder()
                .width(readNullableInt(imageSize, "width"))
                .height(readNullableInt(imageSize, "height"))
                .build())
            .alignment(SurveyRoiAlignmentResponse.builder()
                .rotateDeg(readNullableDouble(alignment, "rotate_deg"))
                .flipped180(readNullableBoolean(alignment, "flipped_180"))
                .build())
            .rois(SurveyRoisResponse.builder()
                .forehead(buildRoiAreaResponse(rois.path("forehead")))
                .leftCheek(buildRoiAreaResponse(rois.path("left_cheek")))
                .rightCheek(buildRoiAreaResponse(rois.path("right_cheek")))
                .build())
            .build();
    }

    private SurveyRoiAreaResponse buildRoiAreaResponse(JsonNode node) {
        if (node.isMissingNode() || node.isNull()) {
            return null;
        }

        // 현재 ROI 는 사각형 bbox 만 노출한다.
        // 향후 polygon 이 필요해지면 이 DTO 아래에만 필드를 추가하면 된다.
        JsonNode bbox = node.path("bbox");
        if (bbox.isMissingNode() || bbox.isNull()) {
            return null;
        }

        return SurveyRoiAreaResponse.builder()
            .bbox(SurveyRoiBboxResponse.builder()
                .x1(readNullableDouble(bbox, "x1"))
                .y1(readNullableDouble(bbox, "y1"))
                .x2(readNullableDouble(bbox, "x2"))
                .y2(readNullableDouble(bbox, "y2"))
                .build())
            .build();
    }

    private List<SurveyWarningResponse> buildWarningResponses(JsonNode node) {
        if (node.isMissingNode() || node.isNull() || !node.isArray()) {
            return List.of();
        }

        // 경고는 분석 실패처럼 요청 자체를 깨는 정보가 아니라,
        // 일부 단계가 생략되었거나 운영상 참고가 필요한 비치명적 메시지로만 내려준다.
        List<SurveyWarningResponse> warnings = new ArrayList<>();
        node.forEach(warningNode -> warnings.add(
            SurveyWarningResponse.builder()
                .stage(warningNode.path("stage").asText(null))
                .detail(warningNode.path("detail").asText(null))
                .build()
        ));
        return warnings;
    }

    private Double readNullableDouble(JsonNode node, String fieldName) {
        // 응답 JSON 에 필드가 없을 수 있는 경우를 허용하기 위해,
        // primitive 가 아닌 nullable wrapper 로 한 번 읽어온다.
        JsonNode valueNode = node.path(fieldName);
        return valueNode.isMissingNode() || valueNode.isNull() ? null : valueNode.asDouble();
    }

    private Integer readNullableInt(JsonNode node, String fieldName) {
        JsonNode valueNode = node.path(fieldName);
        return valueNode.isMissingNode() || valueNode.isNull() ? null : valueNode.asInt();
    }

    private Boolean readNullableBoolean(JsonNode node, String fieldName) {
        JsonNode valueNode = node.path(fieldName);
        return valueNode.isMissingNode() || valueNode.isNull() ? null : valueNode.asBoolean();
    }
}

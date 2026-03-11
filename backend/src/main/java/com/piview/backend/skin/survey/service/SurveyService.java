package com.piview.backend.skin.survey.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.piview.backend.auth.entity.Auth;
import com.piview.backend.auth.repository.AuthRepository;
import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.skin.survey.dto.request.SurveySubmitRequest;
import com.piview.backend.skin.survey.dto.response.SurveySubmitResponse;
import com.piview.backend.skin.survey.entity.MySkin;
import com.piview.backend.skin.survey.entity.SurveySkinType;
import com.piview.backend.skin.survey.repository.MySkinRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SurveyService {

    private final AuthRepository authRepository;
    private final MySkinRepository mySkinRepository;
    private final SurveyScoreCalculator surveyScoreCalculator;

    @Transactional
    public SurveySubmitResponse submitSurvey(Long authId, SurveySubmitRequest request) {
        Auth auth = authRepository.findById(authId)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        SurveySkinType mySkinType = calculateSkinType(request);
        List<String> normalizedSkinProblems = normalizeSkinProblems(request.getSkinProblems());

        auth.updateSurveyProfile(request.getGender(), request.getAgeGroup(), mySkinType);

        mySkinRepository.deleteAllByUserId(authId);
        mySkinRepository.saveAll(createMySkins(authId, normalizedSkinProblems));

        return SurveySubmitResponse.builder()
            .mySkinType(mySkinType)
            .skinProblems(normalizedSkinProblems)
            .build();
    }

    private SurveySkinType calculateSkinType(SurveySubmitRequest request) {
        try {
            return surveyScoreCalculator.calculateSkinType(
                request.getQuestion3(),
                request.getQuestion4(),
                request.getQuestion5(),
                request.getQuestion6()
            );
        } catch (IllegalArgumentException exception) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
    }

    private List<String> normalizeSkinProblems(List<String> skinProblems) {
        return skinProblems.stream()
            .map(String::trim)
            .toList();
    }

    private List<MySkin> createMySkins(Long authId, List<String> skinProblems) {
        return skinProblems.stream()
            .map(skinProblem -> MySkin.builder()
                .userId(authId)
                .skinProblem(skinProblem)
                .build())
            .toList();
    }
}

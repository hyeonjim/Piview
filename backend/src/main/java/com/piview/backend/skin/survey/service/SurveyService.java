package com.piview.backend.skin.survey.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.skin.survey.dto.request.SurveySubmitRequest;
import com.piview.backend.skin.survey.dto.response.SurveySubmitResponse;
import com.piview.backend.skin.survey.entity.MySkin;
import com.piview.backend.skin.survey.entity.SurveySkinType;
import com.piview.backend.skin.survey.repository.MySkinRepository;
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

    @Transactional
    public SurveySubmitResponse submitSurvey(Long userId, SurveySubmitRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        SurveySkinType mySkinType = calculateSkinType(request);
        // Q7 설문 문구는 그대로 저장하지 않고, 내부 추천 태그 기준으로 변환해 저장한다.
        List<String> mappedSkinProblems = surveySkinProblemMapper.mapToTags(request.getSkinProblems());

        user.updateSurveyProfile(request.getGender(), request.getAgeGroup(), mySkinType);

        // 설문은 최신 응답 기준으로 덮어쓴다.
        mySkinRepository.deleteAllByUserId(userId);
        mySkinRepository.saveAll(createMySkins(userId, mappedSkinProblems));

        return SurveySubmitResponse.builder()
            .mySkinType(mySkinType)
            .skinProblems(mappedSkinProblems)
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

    private List<MySkin> createMySkins(Long userId, List<String> skinProblems) {
        return skinProblems.stream()
            .map(skinProblem -> MySkin.builder()
                .userId(userId)
                .skinProblem(skinProblem)
                .build())
            .toList();
    }
}

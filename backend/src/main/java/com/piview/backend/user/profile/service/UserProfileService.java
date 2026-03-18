package com.piview.backend.user.profile.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.skin.survey.entity.MySkin;
import com.piview.backend.skin.survey.repository.MySkinRepository;
import com.piview.backend.user.entity.User;
import com.piview.backend.user.profile.dto.response.UserProfileResponse;
import com.piview.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final MySkinRepository mySkinRepository;

    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile(Long userId) {
        User user = findUser(userId);
        return buildResponse(user, mySkinRepository.findAllByUserId(userId));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private UserProfileResponse buildResponse(User user, List<MySkin> mySkins) {
        return UserProfileResponse.builder()
            .name(user.getName())
            .email(user.getEmail())
            .gender(user.getGender())
            .ageGroup(user.getAgeGroup())
            .mySkinType(user.getMySkinType())
            .skinProblems(mySkins.stream().map(MySkin::getSkinProblem).toList())
            .build();
    }
}

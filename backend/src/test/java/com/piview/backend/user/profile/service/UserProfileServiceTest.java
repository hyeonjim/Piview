package com.piview.backend.user.profile.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.piview.backend.skin.survey.entity.MySkin;
import com.piview.backend.skin.survey.entity.SurveyAgeGroup;
import com.piview.backend.skin.survey.entity.SurveyGender;
import com.piview.backend.skin.survey.entity.SurveySkinType;
import com.piview.backend.skin.survey.repository.MySkinRepository;
import com.piview.backend.user.entity.AuthProvider;
import com.piview.backend.user.entity.User;
import com.piview.backend.user.profile.dto.response.UserProfileResponse;
import com.piview.backend.user.repository.UserRepository;

class UserProfileServiceTest {

    private final UserRepository userRepository = Mockito.mock(UserRepository.class);
    private final MySkinRepository mySkinRepository = Mockito.mock(MySkinRepository.class);
    private final UserProfileService userProfileService = new UserProfileService(userRepository, mySkinRepository);

    @Test
    void getMyProfile_returnsUserAndSkinProblems() {
        User user = createUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(mySkinRepository.findAllByUserId(1L)).thenReturn(List.of(
            MySkin.builder().id(1L).userId(1L).skinProblem("수분").build(),
            MySkin.builder().id(2L).userId(1L).skinProblem("진정").build()
        ));

        UserProfileResponse response = userProfileService.getMyProfile(1L);

        assertThat(response.getName()).isEqualTo("기존이름");
        assertThat(response.getEmail()).isEqualTo("test@example.com");
        assertThat(response.getGender()).isEqualTo(SurveyGender.WOMEN);
        assertThat(response.getAgeGroup()).isEqualTo(SurveyAgeGroup.TWENTIES);
        assertThat(response.getMySkinType()).isEqualTo(SurveySkinType.OILY);
        assertThat(response.getSkinProblems()).containsExactly("수분", "진정");
    }

    private User createUser() {
        return User.builder()
            .id(1L)
            .name("기존이름")
            .email("test@example.com")
            .provider(AuthProvider.KAKAO)
            .providerId("dev_test@example.com")
            .gender(SurveyGender.WOMEN)
            .ageGroup(SurveyAgeGroup.TWENTIES)
            .mySkinType(SurveySkinType.OILY)
            .build();
    }
}

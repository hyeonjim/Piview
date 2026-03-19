package com.piview.backend.user.profile.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.skin.survey.entity.MySkin;
import com.piview.backend.skin.survey.entity.SurveyAgeGroup;
import com.piview.backend.skin.survey.entity.SurveyGender;
import com.piview.backend.skin.survey.entity.SurveySkinType;
import com.piview.backend.skin.survey.repository.MySkinRepository;
import com.piview.backend.user.entity.AuthProvider;
import com.piview.backend.user.entity.User;
import com.piview.backend.user.profile.dto.request.UserProfileUpdateRequest;
import com.piview.backend.user.profile.dto.response.UserProfileResponse;
import com.piview.backend.user.repository.UserRepository;

class UserProfileServiceTest {

    private final UserRepository userRepository = Mockito.mock(UserRepository.class);
    private final MySkinRepository mySkinRepository = Mockito.mock(MySkinRepository.class);
    private final UserProfileService userProfileService = new UserProfileService(userRepository, mySkinRepository);
    private final ObjectMapper objectMapper = new ObjectMapper();

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
        assertThat(response.getImageUrl()).isEqualTo("http://k.kakaocdn.net/dn/profile.jpg");
        assertThat(response.getGender()).isEqualTo(SurveyGender.WOMEN);
        assertThat(response.getAgeGroup()).isEqualTo(SurveyAgeGroup.TWENTIES);
        assertThat(response.getMySkinType()).isEqualTo(SurveySkinType.OILY);
        assertThat(response.getSkinProblems()).containsExactly("수분", "진정");
    }

    @Test
    void updateMyProfile_updatesOnlyProvidedScalarFields() throws Exception {
        User user = createUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(mySkinRepository.findAllByUserId(1L)).thenReturn(List.of(
            MySkin.builder().id(1L).userId(1L).skinProblem("수분").build()
        ));

        UserProfileUpdateRequest request = objectMapper.readValue("""
            {
              "name": "새이름",
              "mySkinType": "DRY"
            }
            """, UserProfileUpdateRequest.class);

        UserProfileResponse response = userProfileService.updateMyProfile(1L, request);

        assertThat(response.getName()).isEqualTo("새이름");
        assertThat(response.getImageUrl()).isEqualTo("http://k.kakaocdn.net/dn/profile.jpg");
        assertThat(response.getMySkinType()).isEqualTo(SurveySkinType.DRY);
        assertThat(response.getGender()).isEqualTo(SurveyGender.WOMEN);
        assertThat(response.getAgeGroup()).isEqualTo(SurveyAgeGroup.TWENTIES);
        assertThat(response.getSkinProblems()).containsExactly("수분");
        verify(mySkinRepository, never()).deleteAllByUserId(1L);
    }

    @Test
    void updateMyProfile_replacesSkinProblemsWhenFieldIsPresent() throws Exception {
        User user = createUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(mySkinRepository.findAllByUserId(1L)).thenReturn(List.of(
            MySkin.builder().id(3L).userId(1L).skinProblem("진정").build(),
            MySkin.builder().id(4L).userId(1L).skinProblem("피지").build()
        ));

        UserProfileUpdateRequest request = objectMapper.readValue("""
            {
              "skinProblems": ["홍조", "피지"]
            }
            """, UserProfileUpdateRequest.class);

        UserProfileResponse response = userProfileService.updateMyProfile(1L, request);

        assertThat(response.getSkinProblems()).containsExactly("진정", "피지");
        verify(mySkinRepository).deleteAllByUserId(1L);
        verify(mySkinRepository).saveAll(anyList());
    }

    @Test
    void updateMyProfile_allowsEmptySkinProblemsArray() throws Exception {
        User user = createUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(mySkinRepository.findAllByUserId(1L)).thenReturn(List.of());

        UserProfileUpdateRequest request = objectMapper.readValue("""
            {
              "skinProblems": []
            }
            """, UserProfileUpdateRequest.class);

        UserProfileResponse response = userProfileService.updateMyProfile(1L, request);

        assertThat(response.getSkinProblems()).isEmpty();
        verify(mySkinRepository).deleteAllByUserId(1L);
        verify(mySkinRepository, never()).saveAll(anyList());
    }

    @Test
    void updateMyProfile_throwsWhenNullValueIsProvided() throws Exception {
        User user = createUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserProfileUpdateRequest request = objectMapper.readValue("""
            {
              "mySkinType": null
            }
            """, UserProfileUpdateRequest.class);

        assertThatThrownBy(() -> userProfileService.updateMyProfile(1L, request))
            .isInstanceOf(CustomException.class)
            .extracting("errorCode")
            .isEqualTo(ErrorCode.INVALID_MY_SKIN_TYPE);
    }

    @Test
    void updateMyProfile_throwsWhenUnknownFieldIsProvided() throws Exception {
        User user = createUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserProfileUpdateRequest request = objectMapper.readValue("""
            {
              "unknownField": "value"
            }
            """, UserProfileUpdateRequest.class);

        assertThatThrownBy(() -> userProfileService.updateMyProfile(1L, request))
            .isInstanceOf(CustomException.class)
            .extracting("errorCode")
            .isEqualTo(ErrorCode.INVALID_USER_PROFILE_REQUEST);
    }

    private User createUser() {
        return User.builder()
            .id(1L)
            .name("기존이름")
            .email("test@example.com")
            .provider(AuthProvider.KAKAO)
            .providerId("dev_test@example.com")
            .imageUrl("http://k.kakaocdn.net/dn/profile.jpg")
            .gender(SurveyGender.WOMEN)
            .ageGroup(SurveyAgeGroup.TWENTIES)
            .mySkinType(SurveySkinType.OILY)
            .build();
    }
}

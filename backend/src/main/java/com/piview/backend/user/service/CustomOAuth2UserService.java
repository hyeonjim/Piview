package com.piview.backend.user.service;

import com.piview.backend.user.entity.User;
import com.piview.backend.user.entity.AuthProvider;
import com.piview.backend.user.repository.UserRepository;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.global.security.oauth2.OAuth2UserInfo;
import com.piview.backend.global.security.oauth2.OAuth2UserInfoFactory;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        try {
            return processOAuth2User(userRequest, oAuth2User);
        } catch (Exception ex) {
            log.error("카카오 로그인 진행 중 에러 발생: {}", ex.getMessage());
            throw new InternalAuthenticationServiceException(ex.getMessage(), ex.getCause());
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest userRequest, OAuth2User oAuth2User) {
        String registrationId = userRequest.getClientRegistration().getRegistrationId(); // "kakao"
        Map<String, Object> attributes = oAuth2User.getAttributes();

        // Factory를 통해 카카오 JSON 정보 추출
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, attributes);

        // 카카오 이메일 필수 동의 체크 검증
        if (userInfo.getEmail() == null || userInfo.getEmail().isEmpty()) {
            throw new OAuth2AuthenticationException(new OAuth2Error("email_not_found"),
                    "카카오 계정에서 이메일 정보를 찾을 수 없습니다.", null);
        }

        // 이메일로 DB 조회 (기존 회원인지 검증)
        Optional<User> authOptional = userRepository.findByEmailIncludingDeleted(userInfo.getEmail());
        User user;

        if (authOptional.isPresent()) {
            user = authOptional.get();

            // 소셜 제공자 검증
            if (user.getProvider() != AuthProvider.valueOf(registrationId.toUpperCase())) {
                throw new OAuth2AuthenticationException(new OAuth2Error("invalid_provider"),
                        user.getProvider() + " 계정으로 가입된 이메일입니다. 해당 계정으로 로그인해주세요.", null);
            }

            // 탈퇴한 유저 복구 로직
            if (user.getDeletedAt() != null) {
                log.info("탈퇴 유저 복구 처리: {}", user.getEmail());
                user.setExist(true);
                user.setDeletedAt(null);
            }

            // 로그인 시 최신 프로필 정보 업데이트
            user = updateExistingUser(user, userInfo);

        } else {
            // 신규 가입
            user = registerNewUser(userRequest, userInfo);
        }

        return UserPrincipal.create(user, attributes);
    }

    // 신규 회원 가입 처리
    private User registerNewUser(OAuth2UserRequest userRequest, OAuth2UserInfo userInfo) {
        User user = new User();
        user.setProvider(AuthProvider.valueOf(userRequest.getClientRegistration().getRegistrationId().toUpperCase()));
        user.setProviderId(userInfo.getId());

        user.setName(userInfo.getName());
        user.setEmail(userInfo.getEmail());

        user.setImageUrl(userInfo.getImageUrl());

        return userRepository.save(user);
    }

    // 기존 회원 정보 업데이트 처리
    private User updateExistingUser(User existingUser, OAuth2UserInfo userInfo) {
        existingUser.setName(userInfo.getName());
        existingUser.setImageUrl(userInfo.getImageUrl());
        return userRepository.save(existingUser);
    }
}

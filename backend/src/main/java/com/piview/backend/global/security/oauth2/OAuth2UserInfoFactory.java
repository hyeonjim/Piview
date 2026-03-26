package com.piview.backend.global.security.oauth2;

import java.util.Map;

public class OAuth2UserInfoFactory {

    public static OAuth2UserInfo getOAuth2UserInfo(String registrationId, Map<String, Object> attributes) {
        // 카카오 로그인이면 KakaoOAuth2UserInfo 객체를 반환
        if (registrationId.equalsIgnoreCase("kakao")) {
            return new KakaoOAuth2UserInfo(attributes);
        } else {
            // 카카오 외의 다른 소셜 로그인이 들어오면 에러 발생 (현재는 카카오만 지원하므로)
            throw new IllegalArgumentException("지원하지 않는 소셜 로그인 제공자입니다: " + registrationId);
        }
    }
}

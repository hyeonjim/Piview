package com.piview.backend.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Getter
@Configuration
@ConfigurationProperties(prefix = "app") // application.yml에서 'app'으로 시작하는 설정을 매핑
public class AppProperties {

    private final Auth auth = new Auth();
    private final OAuth2 oauth2 = new OAuth2();

    @Getter
    @Setter
    public static class Auth {
        private String tokenSecret; // JWT 서명에 사용할 비밀키 (Base64 인코딩 권장)
        private long tokenExpirationMsec; // Access Token 만료 시간 (밀리초)

        private long refreshTokenExpirationDays; // Refresh Token 만료 시간
        private int oauth2CookieExpireSeconds;  // 프론트 전달용 임시 쿠키 수명

        private boolean cookieSecure;
        private String cookieSameSite;
    }

    @Getter
    @Setter
    public static class OAuth2 {
        private List<String> authorizedRedirectUris = new ArrayList<>(); // 허용된 OAuth2 리다이렉트 URI 목록

        // 소셜 로그인 성공/실패 리다이렉트 URI
        private String successRedirectUri;
        private String failureRedirectUri;
    }
}
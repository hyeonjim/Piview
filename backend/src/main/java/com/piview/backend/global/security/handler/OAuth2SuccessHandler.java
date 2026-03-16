package com.piview.backend.global.security.handler;

import com.piview.backend.global.config.AppProperties;
import com.piview.backend.global.redis.RedisService;
import com.piview.backend.global.security.TokenProvider;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.global.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;
import com.piview.backend.global.util.CookieUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final TokenProvider tokenProvider;
    private final RedisService redisService;
    private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;
    private final AppProperties appProperties;
    private final CookieUtil cookieUtil;

    @Value("${app.frontend.redirect-uri}")
    private String frontendRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

        // 유저 정보 꺼내기
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String email = userPrincipal.getEmail();

        log.info("카카오 로그인 성공! JWT 발급 시작 - 이메일: {}", email);

        // JWT Access Token & Refresh Token 생성
        String accessToken = tokenProvider.createToken(authentication);
        String refreshToken = tokenProvider.createRefreshToken(authentication);

        long expireDays = appProperties.getAuth().getRefreshTokenExpirationDays();
        redisService.setValues(email, refreshToken, Duration.ofDays(expireDays));

        // Refresh Token: 해커가 절대 못 훔쳐가게 HttpOnly=true 채우기
        int refreshCookieExpireSeconds = (int) (expireDays * 24 * 60 * 60);
        cookieUtil.addCookie(response, "refreshToken", refreshToken, refreshCookieExpireSeconds);

        // Access Token 임시 쿠키 : 프론트엔드가 자바스크립트로 쏙 빼갈 수 있게 HttpOnly=false로 하고 딱 60초만 굽기
        int tempCookieExpireSeconds = appProperties.getAuth().getOauth2CookieExpireSeconds();
        cookieUtil.addTempCookieForFront(response, "accessToken", accessToken, tempCookieExpireSeconds);

        // properties에서 리다이렉트할 URL 가져오기
        String targetUrl = frontendRedirectUri + "?token=" + accessToken;

        if (response.isCommitted()) {
            log.debug("응답이 이미 커밋되었습니다. {} 로 리다이렉트 할 수 없습니다.", targetUrl);
            return;
        }

        // 6. 사용이 끝난 인가 요청 관련 쿠키 삭제
        clearAuthenticationAttributes(request, response);

        // 7. 최종 리다이렉트 실행
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    protected void clearAuthenticationAttributes(HttpServletRequest request, HttpServletResponse response) {
        super.clearAuthenticationAttributes(request);
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    }
}

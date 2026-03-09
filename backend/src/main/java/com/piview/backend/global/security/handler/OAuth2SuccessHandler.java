package com.piview.backend.global.security.handler;

import com.piview.backend.global.redis.RedisService;
import com.piview.backend.global.security.TokenProvider;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.global.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;
import com.piview.backend.global.util.CookieUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;
import java.util.Optional;

import static com.piview.backend.global.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_PARAM_COOKIE_NAME;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final TokenProvider tokenProvider;
    private final RedisService redisService;
    private final CookieUtil cookieUtil;
    private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

        // 1. 유저 정보 꺼내기
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String email = userPrincipal.getEmail();

        log.info("카카오 로그인 성공! JWT 발급 시작 - 이메일: {}", email);

        // 2. JWT Access Token & Refresh Token 생성
        String accessToken = tokenProvider.createToken(authentication);
        String refreshToken = tokenProvider.createRefreshToken(authentication);

        // 3. Redis에 Refresh Token 저장 (7일 유지)
        redisService.setValues(email, refreshToken, Duration.ofDays(7));

        // 4. 쿠키에 토큰 저장 (HttpOnly, Secure 등은 CookieUtil 내부에 구현되어 있다고 가정)
        cookieUtil.addTokenCookies(response, accessToken, refreshToken);

        // 5. 프론트엔드로 리다이렉트할 URL 결정
        String targetUrl = determineTargetUrl(request, response, authentication, accessToken);

        if (response.isCommitted()) {
            log.debug("응답이 이미 커밋되었습니다. {} 로 리다이렉트 할 수 없습니다.", targetUrl);
            return;
        }

        // 6. 사용이 끝난 인가 요청 관련 쿠키 삭제
        clearAuthenticationAttributes(request, response);

        // 7. 최종 리다이렉트 실행
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    protected String determineTargetUrl(HttpServletRequest request, HttpServletResponse response, Authentication authentication, String accessToken) {
        // 프론트엔드에서 로그인 요청 시 보냈던 redirect_uri 쿠키 찾기
        Optional<String> redirectUri = CookieUtil.getCookie(request, REDIRECT_URI_PARAM_COOKIE_NAME)
                .map(Cookie::getValue);

        int serverPort = request.getServerPort();

        String defaultTargetUrl = (serverPort == 8080)
                ? "http://localhost:3000/oauth2/redirect"  // 로컬 프론트엔드 개발 서버 - 테스트용
                : "https://cosmetics-domain.com/oauth2/redirect"; // 운영 서버 (실제 도메인으로 변경 필요)

        String targetUrl = redirectUri.orElse(defaultTargetUrl);

        // Access Token을 쿼리 파라미터로 붙여서 프론트엔드로 전달
        return UriComponentsBuilder.fromUriString(targetUrl)
                .queryParam("token", accessToken)
                .build().toUriString();
    }

    protected void clearAuthenticationAttributes(HttpServletRequest request, HttpServletResponse response) {
        super.clearAuthenticationAttributes(request);
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    }
}

package com.piview.backend.global.security.handler;

import com.piview.backend.global.config.AppProperties;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.time.Duration;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final TokenProvider tokenProvider;
    private final RedisService redisService;
    private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;
    private final AppProperties appProperties;
    private final CookieUtil cookieUtil;

    // 콤마로 구분된 여러 개의 허용 주소를 List로 싹 받아옴
    @Value("#{'${app.frontend.authorized-redirect-uris}'.split(',')}")
    private List<String> authorizedRedirectUris;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String email = userPrincipal.getEmail();

        log.info("카카오 로그인 성공! JWT 발급 시작 - 이메일: {}", email);

        String accessToken = tokenProvider.createToken(authentication);
        String refreshToken = tokenProvider.createRefreshToken(authentication);

        long expireDays = appProperties.getAuth().getRefreshTokenExpirationDays();
        redisService.setValues(email, refreshToken, Duration.ofDays(expireDays));

        int refreshCookieExpireSeconds = (int) (expireDays * 24 * 60 * 60);
        cookieUtil.addCookie(response, "refreshToken", refreshToken, refreshCookieExpireSeconds);

        int tempCookieExpireSeconds = appProperties.getAuth().getOauth2CookieExpireSeconds();
        cookieUtil.addTempCookieForFront(response, "accessToken", accessToken, tempCookieExpireSeconds);

        // 이제 고정된 주소가 아니라, 동적으로 리다이렉트할 URL을 계산
        String targetUrl = determineTargetUrl(request, response, accessToken);

        if (response.isCommitted()) {
            log.debug("응답이 이미 커밋되었습니다. {} 로 리다이렉트 할 수 없습니다.", targetUrl);
            return;
        }

        clearAuthenticationAttributes(request, response);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    // 프론트엔드가 요청한 주소를 찾고, 안전한 주소인지 검사하는 핵심 로직!
    protected String determineTargetUrl(HttpServletRequest request, HttpServletResponse response, String accessToken) {
        String redirectUri = getRedirectUriFromCookie(request);

        // 프론트가 요청한 주소가 없으면, YML에 적어둔 첫 번째 주소를 기본값으로 씁니다.
        String targetUrl = (redirectUri != null && !redirectUri.isEmpty()) ? redirectUri : authorizedRedirectUris.get(0);

        // 해커가 이상한 주소(피싱 사이트 등)로 튕겨내려는 것을 방지하기 위한 검증!
        if (redirectUri != null && !redirectUri.isEmpty() && !isAuthorizedRedirectUri(redirectUri)) {
            throw new IllegalArgumentException("에러: 허가되지 않은 Redirect URI 입니다! -> " + redirectUri);
        }

        // 프론트엔드 화면으로 넘어갈 때 쿼리 파라미터로 token을 달아줍니다.
        return UriComponentsBuilder.fromUriString(targetUrl)
                .queryParam("token", accessToken)
                .build().toUriString();
    }

    private String getRedirectUriFromCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                // 저장소에서 사용하는 쿠키 이름. 보통 "redirect_uri"를 많이 씁니다!
                if ("redirect_uri".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private boolean isAuthorizedRedirectUri(String uri) {
        URI clientRedirectUri = URI.create(uri);
        return authorizedRedirectUris.stream()
                .anyMatch(authorizedRedirectUri -> {
                    URI authorizedURI = URI.create(authorizedRedirectUri.trim());
                    // 호스트(localhost, j14e101...)와 포트(3000)가 완벽히 일치하는지 확인
                    return authorizedURI.getHost().equalsIgnoreCase(clientRedirectUri.getHost())
                            && authorizedURI.getPort() == clientRedirectUri.getPort();
                });
    }

    protected void clearAuthenticationAttributes(HttpServletRequest request, HttpServletResponse response) {
        super.clearAuthenticationAttributes(request);
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    }
}
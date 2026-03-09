package com.piview.backend.global.security;

import com.piview.backend.global.redis.RedisService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final TokenProvider tokenProvider;
  private final RedisService redisService;

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    // 쿠키에서 accessToken만 쏙 빼오기
    String accessToken = resolveTokenFromCookie(request);

    // 유효성 검사
    if (StringUtils.hasText(accessToken) && tokenProvider.validateToken(accessToken)) {

      // 로그아웃한 유저인지 검사
      String isLogout = redisService.getValues(accessToken);

      if ("logout".equals(isLogout)) {
        log.warn("로그아웃 처리된 액세스 토큰으로 접근 시도 발생!");
      } else {

        // 토큰에서 유저 정보를 꺼내서 신분증(Authentication)을 만듦
        Authentication authentication = tokenProvider.getAuthentication(accessToken);

        // SecurityContext에 유저 저장
        SecurityContextHolder.getContext().setAuthentication(authentication);
        log.debug("Security Context에 '{}' 인증 정보를 저장했습니다.", authentication.getName());
      }
    }

    filterChain.doFilter(request, response);
  }

  // 요청(Request)의 쿠키 목록에서 accessToken 값만 찾아내는 역할
  private String resolveTokenFromCookie(HttpServletRequest request) {
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
      for (Cookie cookie : cookies) {
        if ("accessToken".equals(cookie.getName())) {
          return cookie.getValue();
        }
      }
    }
    return null;
  }
}
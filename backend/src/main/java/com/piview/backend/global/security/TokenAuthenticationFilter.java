package com.piview.backend.global.security; // PiView 패키지명 적용

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
public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private final TokenProvider tokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        // 1. 요청에서 JWT 토큰을 꺼냄 (헤더 또는 쿠키)
        String jwt = resolveToken(request);

        // 2. 토큰이 존재하고, 유효성 검증(만료, 위변조 등)을 통과했다면
        if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
            // 3. 토큰에서 유저 정보를 꺼내서 시큐리티 인증 객체 생성
            Authentication authentication = tokenProvider.getAuthentication(jwt);

            // 4. 강제로 시큐리티 컨텍스트에 인증 객체를 꽂아넣음 (이후 컨트롤러에서 @AuthenticationPrincipal로 꺼내 쓰기)
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // 5. 다음 필터로 요청을 넘김 (토큰이 없거나 무효해도 통과시킴)
        filterChain.doFilter(request, response);
    }

    // 헤더 또는 쿠키에서 토큰을 찾는 헬퍼 메서드
    private String resolveToken(HttpServletRequest request) {
        // HTTP 헤더에서 Bearer 토큰 추출
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        // 헤더에 없으면 "accessToken"이라는 이름표가 붙은 쿠키를 찾아서 꺼냄
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
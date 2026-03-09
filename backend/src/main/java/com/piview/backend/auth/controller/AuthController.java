package com.piview.backend.auth.controller;

import com.piview.backend.auth.dto.response.TokenResponseDto;
import com.piview.backend.auth.service.AuthService;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.global.util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  // 토큰 재발급 API
  @PostMapping("/refresh")
  public ResponseEntity<?> refreshToken(@CookieValue(value = "refreshToken", required = false) String refreshToken,
      HttpServletResponse response) {

    // 쿠키가 아예 안 넘어왔을 때 방어
    if (!StringUtils.hasText(refreshToken)) {
      return ResponseEntity.badRequest().body("쿠키에 리프레시 토큰이 없습니다.");
    }

    TokenResponseDto newTokens = authService.reissue(refreshToken);

    CookieUtil.addCookie(response, "refreshToken", newTokens.getRefreshToken(), 14 * 24 * 60 * 60); // 14일

    return ResponseEntity.ok(newTokens);
  }

  // 로그아웃 API
  @PostMapping("/logout")
  public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authorizationHeader,
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      HttpServletRequest request,
      HttpServletResponse response) {

    // 헤더에서 "Bearer " 떼어내기
    String accessToken = null;
    if (StringUtils.hasText(authorizationHeader) && authorizationHeader.startsWith("Bearer ")) {
      accessToken = authorizationHeader.substring(7);
    }

    // 토큰과 유저 정보가 정상적으로 존재할 때만 Service 호출 (Redis 블랙리스트 및 삭제 처리)
    if (userPrincipal != null && StringUtils.hasText(accessToken)) {
      authService.logout(accessToken, userPrincipal.getEmail());
      log.info("유저 [{}] 로그아웃 요청 처리 완료", userPrincipal.getEmail());
    }

    // 브라우저 속 refresh token 제거
    CookieUtil.deleteCookie(request, response, "refreshToken");

    return ResponseEntity.ok("로그아웃 되었습니다.");
  }
}
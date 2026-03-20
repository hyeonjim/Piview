package com.piview.backend.domain.user.login.service;

import com.piview.backend.domain.user.login.dto.response.TokenDto;
import com.piview.backend.global.config.AppProperties;
import com.piview.backend.global.redis.RedisService;
import com.piview.backend.global.security.CustomUserDetailsService;
import com.piview.backend.global.security.TokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

  private final TokenProvider tokenProvider;
  private final RedisService redisService;
  private final CustomUserDetailsService customUserDetailsService;
  private final AppProperties appProperties;

  // 토큰 재발급 로직
  public TokenDto reissue(String refreshToken) {

    // 토큰 자체 유효성 검사
    if (!tokenProvider.validateToken(refreshToken)) {
      throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
    }

    // 토큰에서 이메일 추출
    String email = tokenProvider.getEmailFromToken(refreshToken);

    // Redis 금고 대조 (탈취 방어)
    String redisRefreshToken = redisService.getValues(email);
    if (redisRefreshToken == null || !redisRefreshToken.equals(refreshToken)) {
      throw new IllegalArgumentException("리프레시 토큰 정보가 일치하지 않습니다. (탈취 의심 또는 이미 로그아웃됨)");
    }

    // DB에서 최신 유저 정보 다시 조회
    UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
    Authentication authentication = new UsernamePasswordAuthenticationToken(
        userDetails, null, userDetails.getAuthorities()
    );

    // 액세스 토큰과 리프레시 토큰 모두 새로 발급
    String newAccessToken = tokenProvider.createToken(authentication);
    String newRefreshToken = tokenProvider.createRefreshToken(authentication);

    // Redis에 새로운 리프레시 토큰으로 덮어쓰기
    long expireDays = appProperties.getAuth().getRefreshTokenExpirationDays();
    redisService.setValues(email, newRefreshToken, Duration.ofDays(expireDays));

    return TokenDto.builder()
        .accessToken(newAccessToken)
        .refreshToken(newRefreshToken)
        .build();
  }

  // 로그아웃 로직
  public void logout(String accessToken, String email) {

    // Redis에서 해당 유저의 리프레시 토큰 없애기
    if (redisService.getValues(email) != null) {
      redisService.deleteValues(email);
    }

    // 현재 들고 온 액세스 토큰 남은 시간을 계산
    Long expiration = tokenProvider.getExpiration(accessToken);

    // 남은 시간 동안 이 액세스 토큰을 못 쓰게 Redis에 "logout" 꼬리표를 달기
    redisService.setValues(accessToken, "logout", Duration.ofMillis(expiration));
  }
}

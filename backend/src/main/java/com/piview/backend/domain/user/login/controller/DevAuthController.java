package com.piview.backend.domain.user.login.controller;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.TokenProvider;
import com.piview.backend.domain.user.login.entity.AuthProvider;
import com.piview.backend.domain.user.login.entity.User;
import com.piview.backend.domain.user.login.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@Tag(name = "🚨 개발용 인증 (Dev) API", description = "Swagger 테스트 전용 토큰 발급 API (운영 배포 시 삭제 필수!)")
@RestController
@RequestMapping("/auth/dev")
@RequiredArgsConstructor
public class DevAuthController {

  private final UserRepository userRepository;
  private final TokenProvider tokenProvider;

  @Operation(summary = "테스트용 Access Token 강제 발급",
      description = "이메일을 입력하면 해당 유저의 Access Token을 발급합니다. 유저가 없으면 새로 생성합니다.")
  @GetMapping("/login")
  public ApiResponse<String> devLogin(
      @Parameter(description = "테스트할 유저 이메일", example = "test@kakao.com")
      @RequestParam(defaultValue = "test@kakao.com") String email) {

    // DB에서 유저 찾기 (없으면 테스트용 가짜 유저 강제 생성)
    User user = userRepository.findByEmailIncludingDeleted(email)
        .map(existingUser -> {
          // 탈퇴한 유저(`exist = false`)라면 개발 테스트를 위해 다시 살려냅니다.
          if (existingUser.getExist() == null || !existingUser.getExist()) {
            existingUser.setExist(true);
            existingUser.setDeletedAt(null);
            return userRepository.save(existingUser);
          }
          return existingUser;
        })
        .orElseGet(() -> {
          User newUser = User.builder()
              .email(email)
              .name("개발테스트유저")
              .provider(AuthProvider.KAKAO)
              .providerId("dev_" + email)
              .exist(true)
              .build();
          return userRepository.save(newUser);
        });

    // JWT 토큰 생성
    String accessToken = tokenProvider.createDevAccessToken(user.getId(), user.getEmail(), "ROLE_USER");

    // 토큰만 깔끔하게 리턴 (화면에서 바로 복사하기 좋게)
    return ApiResponse.success("개발용 토큰이 발급되었습니다. data 필드의 값을 복사하세요!", accessToken);
  }
}
package com.piview.backend.global.config;

import com.piview.backend.domain.user.login.service.CustomOAuth2UserService;
import com.piview.backend.global.security.JwtAuthenticationFilter;
import com.piview.backend.global.security.handler.OAuth2FailureHandler;
import com.piview.backend.global.security.handler.OAuth2SuccessHandler;
import com.piview.backend.global.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final CustomOAuth2UserService customOAuth2UserService;
  private final OAuth2SuccessHandler oAuth2SuccessHandler;
  private final OAuth2FailureHandler oAuth2FailureHandler;
  private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;
  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource) throws Exception {
    http
        // 1. CORS 설정
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))

        // 2. CSRF 비활성화
        .csrf(AbstractHttpConfigurer::disable)

        // 3. 폼 로그인 및 Basic 인증 비활성화 (소셜 로그인만 사용)
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)

        // 4. 세션 관리 비활성화 (JWT를 사용하므로 STATELESS)
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

        // 5. URL별 권한 설정
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**", "/webjars/**").permitAll()
            // 누구나 접근 가능한 URL (헬스 체크, 정적 리소스, 인증 관련)
            .requestMatchers("/health", "/error").permitAll()
            .requestMatchers("/", "/css/**", "/images/**", "/js/**", "/favicon.ico").permitAll()
            .requestMatchers("/oauth2/**", "/login/**").permitAll()
            .requestMatchers("/api/v1/auth/**", "/api/v1/oauth2/**").permitAll()
            .requestMatchers("/api/v1/auth/refresh").permitAll()
            .requestMatchers("/api/v1/ocr/**").permitAll()
            .requestMatchers("/auth/dev/**").permitAll()
            .requestMatchers("/api/v1/s3/**", "/api/s3/**", "/api/v1/s3/**").permitAll()

            .anyRequest().authenticated()
        )

        // 6. 소셜 로그인(OAuth2) 설정
        .oauth2Login(oauth2 -> oauth2
            // 로그인 창으로 이동하기 전 임시 정보(Redirect URI)를 쿠키에 저장
            .authorizationEndpoint(authorization -> authorization
                .baseUri("/oauth2/authorization")
                .authorizationRequestRepository(httpCookieOAuth2AuthorizationRequestRepository)
            )
            // 카카오에서 정보를 받아와서 DB에 처리할 서비스 등록
            .userInfoEndpoint(userInfo -> userInfo
                .userService(customOAuth2UserService)
            )
            // 성공/실패 - 핸들러 등록
            .successHandler(oAuth2SuccessHandler)
            .failureHandler(oAuth2FailureHandler)
        )

        .exceptionHandling(exception -> exception
            .authenticationEntryPoint((request, response, authException) -> {
              response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
            })
        );

    // 7. JWT 문지기 필터
    http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  // CORS 세부 설정 빈
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();

    // 프론트엔드 주소 허용 (테스트용 모든 오리진 허용. 실제 배포 시에는 구체적인 도메인으로 변경 필수)
    configuration.setAllowedOriginPatterns(List.of("*"));

    // 허용할 HTTP 메서드
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

    // 허용할 HTTP 헤더
    configuration.setAllowedHeaders(List.of("*"));

    // 쿠키 및 인증 헤더를 주고받을 수 있도록 허용
    configuration.setAllowCredentials(true);

    // Authorization 헤더 노출 추가
    configuration.setExposedHeaders(List.of("Set-Cookie", "Authorization"));

    // 프론트엔드가 쿠키만 읽을 수 있게 Set-Cookie만 남기기
    configuration.setExposedHeaders(List.of("Set-Cookie"));

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}
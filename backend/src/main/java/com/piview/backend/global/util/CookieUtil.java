package com.piview.backend.global.util; // 패키지명 utill -> util 로 오타 수정 및 경로 변경

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.Base64;
import java.util.Optional;

@Component
public class CookieUtil {

    private static final String ACCESS_TOKEN_NAME = "accessToken";
    private static final String REFRESH_TOKEN_NAME = "refreshToken";
    private static final String REFRESH_TOKEN_PATH = "/";

    // 토큰 유효시간
    private static final int ACCESS_TOKEN_AGE = 30 * 60; // 30분
    private static final int REFRESH_TOKEN_AGE = 7 * 24 * 60 * 60; // 7일

    // 쿠키 굽기 (로그인 성공 시)
    public void addTokenCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        // Access Token
        ResponseCookie accessCookie = ResponseCookie.from(ACCESS_TOKEN_NAME, accessToken)
                .path("/")
                .httpOnly(true)
                .secure(false)  // 로컬 테스트용 false, 실제 배포때 true로 변경 필수
                .maxAge(ACCESS_TOKEN_AGE)
                .sameSite("Lax")
                .build();

        // Refresh Token
        ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_TOKEN_NAME, refreshToken)
                .path(REFRESH_TOKEN_PATH)
                .httpOnly(true)
                .secure(false) // 배포 시 true
                .maxAge(REFRESH_TOKEN_AGE)
                .sameSite("Lax")
                .build();

        response.addHeader("Set-Cookie", accessCookie.toString());
        response.addHeader("Set-Cookie", refreshCookie.toString());
    }

    // 쿠키 삭제 (로그아웃 시)
    public void deleteTokenCookies(HttpServletResponse response) {
        ResponseCookie accessCookie = ResponseCookie.from(ACCESS_TOKEN_NAME, "")
                .path("/")
                .httpOnly(true)
                .secure(false)
                .maxAge(0) // 0으로 설정하여 즉시 만료
                .sameSite("Lax")
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_TOKEN_NAME, "")
                .path(REFRESH_TOKEN_PATH)
                .httpOnly(true)
                .secure(false)
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.addHeader("Set-Cookie", accessCookie.toString());
        response.addHeader("Set-Cookie", refreshCookie.toString());
    }

    // 요청에서 특정 이름의 쿠키 가져오기
    public static Optional<Cookie> getCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null && cookies.length > 0) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    return Optional.of(cookie);
                }
            }
        }
        return Optional.empty();
    }

    // 일반 쿠키 저장 (OAuth2 인가 요청 정보 임시 저장용)
    public static void addCookie(HttpServletResponse response, String name, String value, int maxAge, boolean secure) {
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(maxAge);
        cookie.setSecure(secure);
        response.addCookie(cookie);
    }

    // 일반 쿠키 삭제
    public static void deleteCookie(HttpServletRequest request, HttpServletResponse response, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null && cookies.length > 0) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    cookie.setValue("");
                    cookie.setPath("/");
                    cookie.setMaxAge(0);
                    response.addCookie(cookie);
                }
            }
        }
    }

    // 객체 -> 문자열 직렬화 (Spring의 Deprecated된 SerializationUtils 대체)
    public static String serialize(Object object) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ObjectOutputStream oos = new ObjectOutputStream(baos)) {
            oos.writeObject(object);
            return Base64.getUrlEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            throw new IllegalArgumentException("객체 직렬화에 실패했습니다.", e);
        }
    }

    // 문자열 -> 객체 역직렬화 (Spring의 Deprecated된 SerializationUtils 대체)
    public static <T> T deserialize(Cookie cookie, Class<T> cls) {
        byte[] decodedBytes = Base64.getUrlDecoder().decode(cookie.getValue());
        try (ByteArrayInputStream bais = new ByteArrayInputStream(decodedBytes);
             ObjectInputStream ois = new ObjectInputStream(bais)) {
            return cls.cast(ois.readObject());
        } catch (Exception e) {
            throw new IllegalArgumentException("쿠키 역직렬화에 실패했습니다.", e);
        }
    }

    public static void addTempCookieForFront(HttpServletResponse response, String name, String value, int maxAge, boolean secure) {
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");

        // 자바스크립트(document.cookie)로 읽을 수 있도록 HttpOnly를 꺼주기
        cookie.setHttpOnly(false);
        cookie.setMaxAge(maxAge);
        cookie.setSecure(secure);
        response.addCookie(cookie);
    }
}
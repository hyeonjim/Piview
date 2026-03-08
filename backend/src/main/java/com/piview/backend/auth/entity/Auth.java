package com.piview.backend.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "auth") // DB에 생성될 테이블 이름
@Getter
@Setter // CustomOAuth2UserService에서 값 업데이트를 위해 사용
@NoArgsConstructor
@AllArgsConstructor
public class Auth {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 닉네임
    @Column(nullable = false)
    private String name;

    // 카카오 계정 이메일
    @Column(nullable = false, unique = true)
    private String email;

    // 가입 경로 (KAKAO)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider provider;

    // 카카오에서 부여한 사용자 고유 ID
    @Column(name = "provider_id", nullable = false)
    private String providerId;

    // 탈퇴 유저 복구(Soft Delete) 처리를 위한 타임스탬프
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // EntityListeners 만들기
}
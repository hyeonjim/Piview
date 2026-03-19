package com.piview.backend.user.entity;

import java.time.LocalDateTime;

import com.piview.backend.global.util.BaseEntity;
import com.piview.backend.skin.survey.entity.SurveyAgeGroup;
import com.piview.backend.skin.survey.entity.SurveyGender;
import com.piview.backend.skin.survey.entity.SurveySkinType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE users SET exist = false, deleted_at = CURRENT_TIMESTAMP WHERE user_id = ?")
@SQLRestriction("exist = true")
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
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

    private String imageUrl;

    // 설문 응답으로 갱신되는 사용자 기본 프로필 값들이다.
    // 성별 값을 저장한다.
    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 10)
    private SurveyGender gender;

    // 연령대 값을 저장한다.
    @Enumerated(EnumType.STRING)
    @Column(name = "age_group", length = 20)
    private SurveyAgeGroup ageGroup;

    // 사용자 피부 타입 값을 저장한다.
    @Enumerated(EnumType.STRING)
    @Column(name = "my_skin_type", length = 20)
    private SurveySkinType mySkinType;

    // 사용자 활성 여부를 저장한다.
    @Column(name = "exist")
    private Boolean exist;

    // 탈퇴 유저 복구(Soft Delete) 처리를 위한 타임스탬프
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // 설문 제출 시 회원 기본 프로필만 한 번에 갱신할 수 있게 둔다.
    public void updateSurveyProfile(
        SurveyGender gender,
        SurveyAgeGroup ageGroup,
        SurveySkinType mySkinType
    ) {
        this.gender = gender;
        this.ageGroup = ageGroup;
        this.mySkinType = mySkinType;
    }
}

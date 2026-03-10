package com.piview.backend.user.profile.entity;

import com.piview.backend.auth.entity.Auth;
import com.piview.backend.skin.survey.entity.SurveyAgeGroup;
import com.piview.backend.skin.survey.entity.SurveyGender;
import com.piview.backend.skin.survey.entity.SurveySkinType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "users",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_users_auth_id", columnNames = "auth_id")
    }
)
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    // 이 필드 타입이 Auth라서 User가 Auth 엔티티와 연결된다고 해석한다.
    // users.auth_id 컬럼을 만들고, 기본적으로 auth.id(PK)를 참조하도록 매핑한다.
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "auth_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_users_auth")
    )
    private Auth auth;

    // 설문 응답으로 갱신되는 사용자 기본 프로필 값들이다.
    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 10)
    private SurveyGender gender;

    @Enumerated(EnumType.STRING)
    @Column(name = "age_group", length = 20)
    private SurveyAgeGroup ageGroup;

    @Enumerated(EnumType.STRING)
    @Column(name = "my_skin_type", length = 30)
    private SurveySkinType mySkinType;

    public static User create(Auth auth) {
        return User.builder()
            .auth(auth)
            .build();
    }

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

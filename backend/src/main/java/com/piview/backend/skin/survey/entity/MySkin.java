package com.piview.backend.skin.survey.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "my_skin")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class MySkin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "myskin_id")
    private Long id;

    // 현재는 로그인 사용자 식별자(Auth.id)를 userId로 연결한다.
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "skin_problem", nullable = false, length = 20)
    private String skinProblem;
}

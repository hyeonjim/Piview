package com.piview.backend.product.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "skin_types") // MySQL 충돌 방지를 위해 스네이크 케이스 적용
@Getter
@NoArgsConstructor
public class SkinType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // MySQL의 Auto Increment 사용
    @Column(name = "skin_type_id")
    private Integer skinTypeId; // ERD의 int 타입에 맞춰 Integer 사용

    @Column(name = "skin_type", length = 20) // varchar(20) 및 NULL 허용(기본값) 적용
    private String skinType;

}
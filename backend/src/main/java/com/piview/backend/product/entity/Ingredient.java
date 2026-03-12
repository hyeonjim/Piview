package com.piview.backend.product.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Ingredients")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ingredient_id")
    private Long ingredientId;

    @Column(name = "name_en", nullable = false)
    private String nameEn;

    @Column(name = "name_ko")
    private String nameKo;

    @Column(name = "ewg_score_min")
    private Integer ewgScoreMin;

    @Column(name = "ewg_score_max")
    private Integer ewgScoreMax;

    @Column(name = "ewg_grade")
    @Enumerated(EnumType.STRING)
    private EwgGrade ewgGrade;

    @Column(name = "coos_functions", columnDefinition = "TEXT")
    private String coosFunctions;   // COOS 기능명 쉼표 구분("보습제, 유연화제, ...")
}
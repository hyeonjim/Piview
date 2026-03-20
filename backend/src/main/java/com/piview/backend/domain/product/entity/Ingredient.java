package com.piview.backend.domain.product.entity;

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

    @Column(name = "name_en", nullable = false, length = 2000)
    private String nameEn;

    @Column(name = "name_ko", length = 500)
    private String nameKo;

    @Column(name = "has_allergen")
    private Boolean hasAllergen;

    @Column(name = "coos_functions")
    private String coosFunctions;

    @Column(name = "ewg_score_min")
    private Integer ewgScoreMin;

    @Column(name = "ewg_score_max")
    private Integer ewgScoreMax;

    @Column(name = "ewg_grade")
    @Enumerated(EnumType.STRING)
    private EwgGrade ewgGrade;
}

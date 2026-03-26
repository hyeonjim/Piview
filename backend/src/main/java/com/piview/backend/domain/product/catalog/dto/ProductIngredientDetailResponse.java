package com.piview.backend.domain.product.catalog.dto;


import com.piview.backend.domain.product.entity.EwgGrade;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ProductIngredientDetailResponse {

    private Integer position;
    private String nameKo;
    private String nameEn;
    private EwgGrade ewgGrade;  // low, medium, high, null(unknown)
    private Integer ewgScore;   // (ewg_score_min + ewg_score_max) / 2 반올림, null 이면 null
    private String functions;   // Ingredient.coosFunctions
    private Boolean isAllergen;
}

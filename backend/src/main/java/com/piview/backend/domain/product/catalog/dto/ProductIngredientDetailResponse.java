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
    private String functions;   // Ingredient.coosFunctions
    private Boolean isAllergen;
}

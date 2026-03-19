package com.piview.backend.user.disliked.dto.response;

import com.piview.backend.product.entity.EwgGrade;

public record DislikedIngredientSummaryResponse(
    Long ingredientId,
    String nameKo,
    String nameEn,
    EwgGrade ewgGrade
) {
}

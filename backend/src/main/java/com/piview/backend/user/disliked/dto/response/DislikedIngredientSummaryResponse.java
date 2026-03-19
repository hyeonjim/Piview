package com.piview.backend.user.disliked.dto.response;

import com.piview.backend.product.entity.EwgGrade;
import io.swagger.v3.oas.annotations.media.Schema;

// 문제 성분 목록 조회 시 성분 카드 1건에 필요한 최소 정보만 담는다.
public record DislikedIngredientSummaryResponse(
    @Schema(description = "성분 ID입니다.", example = "2")
    Long ingredientId,

    @Schema(description = "성분 한글명입니다.", example = "리모넨")
    String nameKo,

    @Schema(description = "성분 영문명입니다.", example = "Limonene")
    String nameEn,

    @Schema(description = "EWG 등급입니다.", example = "medium")
    EwgGrade ewgGrade
) {
}

package com.piview.backend.domain.product.recommand.dto;

import java.util.List;

public class RecommendRequestDto {
    private String skinType;          // "수부지", "건성", "지성", "복합성"
    private String gender;
    private boolean isSensitive;      // true/false (민감성 여부, 25종 향료 필터링용)
    private Long concernId;           // 주력 피부고민 ID (예: 1=여드름, 2=미백)
    private String targetCategory;    // 추천받을 카테고리 (예: "크림")
    private List<Long> currentRoutineProductIds;
}

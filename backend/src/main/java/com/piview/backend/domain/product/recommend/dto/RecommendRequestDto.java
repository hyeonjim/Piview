package com.piview.backend.domain.product.recommend.dto;

import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class RecommendRequestDto {
    private String skinType;          // "수부지", "건성", "지성", "복합성"
    private String gender;
    private Long concernId;           // 주력 피부고민 ID (예: 1=여드름, 2=미백)
    private Long targetRoutineColId;    // 추천받을 카테고리 (예: "크림")
}

package com.piview.backend.domain.product.recommend.dto;

import com.piview.backend.domain.skin.common.SkinTypeEnum;
import com.piview.backend.domain.skin.survey.entity.SurveyGender;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class RecommendRequestDto {
    @Schema(example = "dry")
    private SkinTypeEnum skinType;
    // "수부지", "건성", "지성", "복합성"
    @Schema(example = "WOMEN")
    private SurveyGender gender;

    @Schema(example = "3")
    private Long concernId;           // 주력 피부고민 ID (예: 1=여드름, 2=미백)

    @Schema(example = "3")
    private Long targetRoutineColId;    // 추천받을 카테고리 (예: "크림")
}

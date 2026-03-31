package com.piview.backend.domain.product.recommend.dto;

import com.piview.backend.domain.skin.common.SkinTypeEnum;
import com.piview.backend.domain.skin.survey.entity.SurveyGender;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RecommendMultiRequestDto {
    @Schema(example = "dry")
    private SkinTypeEnum skinType;

    @Schema(example = "WOMEN")
    private SurveyGender gender;

    @Schema(example = "3")
    private Long concernId;           // 주력 피부고민 ID

    @Schema(example = "[3, 5, 6]")
    private List<Long> targetRoutineColIds;    // 추천받을 카테고리 리스트
}

package com.piview.backend.domain.routine.item.dto;

import com.piview.backend.domain.product.entity.SkinTypeEnum;
import lombok.Builder;

@Builder
public record MyCosResponseDto (
    Long id,
    String brand,
    String productName,
    String category,
    String imageUrl,
    SkinTypeEnum topSkinType,
    SkinTypeEnum top2SkinType
){}
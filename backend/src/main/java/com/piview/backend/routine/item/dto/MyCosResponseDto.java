package com.piview.backend.routine.item.dto;

import com.piview.backend.product.entity.SkinTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
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
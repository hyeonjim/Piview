package com.piview.backend.routine.item.dto;

import lombok.Builder;

@Builder
public record MyCosResponseDto (
    Long id,
    String brand,
    String productName,
    String category,
    String imageUrl,
    int extraInfo
){}
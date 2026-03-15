package com.piview.backend.routine.core.dto;

public record DraftItemDto(
    Integer columnId,
    Long productId,
    Integer stepOrder
) {}

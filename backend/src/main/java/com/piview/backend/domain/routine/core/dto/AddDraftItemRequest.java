package com.piview.backend.domain.routine.core.dto;

public record AddDraftItemRequest(
    Integer columnId,
    Long productId
) {}

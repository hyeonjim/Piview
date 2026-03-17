package com.piview.backend.routine.core.dto;

public record AddDraftItemRequest(
    Integer columnId,
    Long productId
) {}

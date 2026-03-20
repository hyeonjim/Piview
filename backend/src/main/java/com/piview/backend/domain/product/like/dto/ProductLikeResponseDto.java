package com.piview.backend.domain.product.like.dto;

public record ProductLikeResponseDto(
    boolean isLiked,
    String message
) {}

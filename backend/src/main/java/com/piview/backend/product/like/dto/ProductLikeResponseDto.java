package com.piview.backend.product.like.dto;

public record ProductLikeResponseDto(
    boolean isLiked,
    String message
) {}

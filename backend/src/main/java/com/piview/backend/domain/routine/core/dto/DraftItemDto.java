package com.piview.backend.domain.routine.core.dto;

import com.piview.backend.domain.product.catalog.dto.ProductSummaryResponse;

public record DraftItemDto(
    Integer columnId,
    Integer stepOrder,
    ProductSummaryResponse product
) {}

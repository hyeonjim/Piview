package com.piview.backend.routine.core.dto;

import com.piview.backend.product.catalog.dto.ProductSummaryResponse;

public record DraftItemDto(
    Integer columnId,
    Integer stepOrder,
    ProductSummaryResponse product
) {}

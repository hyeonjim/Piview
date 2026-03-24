package com.piview.backend.domain.routine.item.dto;

import com.piview.backend.domain.product.catalog.dto.ProductSummaryResponse;

public record MyCosResponseDto(
    Long myCosId,
    ProductSummaryResponse productInfo
) {}


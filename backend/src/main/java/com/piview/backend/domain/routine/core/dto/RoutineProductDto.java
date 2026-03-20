package com.piview.backend.domain.routine.core.dto;

import com.piview.backend.domain.product.catalog.dto.ProductSummaryResponse;

public record RoutineProductDto(
    Long routineDetailId,
    Integer stepOrder,
    ProductSummaryResponse product
) {}

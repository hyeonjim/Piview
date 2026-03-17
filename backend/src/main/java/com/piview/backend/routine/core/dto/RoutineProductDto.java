package com.piview.backend.routine.core.dto;

import com.piview.backend.product.catalog.dto.ProductSummaryResponse;

public record RoutineProductDto(
    Long routineDetailId,
    Integer stepOrder,
    ProductSummaryResponse product
) {}

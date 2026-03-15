package com.piview.backend.routine.core.dto;

public record RoutineProductDto(
    Long routineDetailId,
    Long productId,
    Integer stepOrder
) {}

package com.piview.backend.domain.routine.core.dto;

import java.util.List;

public record RoutineStepGroupDto(
    Integer columnId,
    String columnName,
    List<RoutineProductDto> products
) {}

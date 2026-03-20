package com.piview.backend.domain.routine.core.dto;

import java.util.List;

public record RoutineResponse(
    Long routineId,
    String title,
    boolean isMain,
    List<RoutineStepGroupDto> steps
) {}

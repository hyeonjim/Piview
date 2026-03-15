package com.piview.backend.routine.core.dto;

import java.util.List;

public record RoutineResponse(
    Long routineId,
    String title,
    boolean isMain,
    List<RoutineStepGroupDto> steps
) {}

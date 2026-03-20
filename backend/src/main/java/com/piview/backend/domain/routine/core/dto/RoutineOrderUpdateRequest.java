package com.piview.backend.domain.routine.core.dto;

import java.util.List;

public record RoutineOrderUpdateRequest(
    List<RoutineDetailOrderDto> updatedOrders
) {}

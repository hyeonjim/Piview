package com.piview.backend.routine.core.dto;

import java.util.List;

public record RoutineOrderUpdateRequest(
    List<RoutineDetailOrderDto> updatedOrders
) {}

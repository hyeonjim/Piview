package com.piview.backend.domain.routine.core.dto;

import java.util.List;

public class RoutineRequestDto {

  public record RoutineOrderUpdateRequest(
      List<RoutineDetailOrderDto> updatedOrders
  ) {}

  public record RoutineDetailOrderDto(
      Long routineDetailId,
      Integer stepOrder
  ) {}

}

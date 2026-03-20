package com.piview.backend.domain.routine.core.dto;

import com.piview.backend.domain.product.catalog.dto.ProductSummaryResponse;
import java.util.List;

public class RoutineResponseDto {

  // 루틴 상세 조회용 (최상위)
  public record RoutineResponse(
      Long routineId,
      String title,
      boolean isMain,
      List<RoutineStepGroupDto> steps
  ) {}

  // 루틴 단계별 그룹
  public record RoutineStepGroupDto(
      Integer columnId,
      String columnName,
      List<RoutineProductDto> products
  ) {}

  // 루틴 그룹 내 개별 제품
  public record RoutineProductDto(
      Long routineDetailId,
      Integer stepOrder,
      ProductSummaryResponse product
  ) {}

}

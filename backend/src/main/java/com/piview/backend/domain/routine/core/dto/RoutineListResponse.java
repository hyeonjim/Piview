package com.piview.backend.domain.routine.core.dto;

public record RoutineListResponse(
    Long routineId,
    String title,
    Boolean isMain,
    Integer productCount // 루틴에 포함된 총 제품 개수
) {}
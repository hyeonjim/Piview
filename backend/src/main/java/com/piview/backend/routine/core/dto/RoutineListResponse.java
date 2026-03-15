package com.piview.backend.routine.core.dto;

public record RoutineListResponse(
    Long routineId,
    String title,
    boolean isMain,
    int productCount // 루틴에 포함된 총 제품 개수
) {}
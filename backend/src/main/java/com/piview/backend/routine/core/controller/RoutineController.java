package com.piview.backend.routine.core.controller;

import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.routine.core.dto.RoutineResponse;
import com.piview.backend.routine.core.service.RoutineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/routines")
@RequiredArgsConstructor
public class RoutineController {
  private final RoutineService routineService;

  // 루틴 생성 요청 DTO
  public record CreateRoutineRequest(Long userId, String title) {}

  // 루틴 생성
  @PostMapping
  public ResponseEntity<Long> createRoutine(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestBody CreateRoutineRequest request) {

    Long userId = userPrincipal.getId();
    Long routineId = routineService.createRoutine(userId, request.title());
    return ResponseEntity.ok(routineId);
  }

  // 루틴 상세정보 조회
  @GetMapping("/{routineId}")
  public ResponseEntity<RoutineResponse> getRoutineDetails(@PathVariable Long routineId) {
    RoutineResponse response = routineService.getRoutineDetails(routineId);
    return ResponseEntity.ok(response);
  }
}

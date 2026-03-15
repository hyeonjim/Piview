package com.piview.backend.routine.core.controller;

import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.routine.core.dto.RoutineOrderUpdateRequest;
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

  // 루틴 수정(순서 및 이름 변경)
  @PatchMapping("/{routineId}/order")
  public ResponseEntity<Void> updateRoutineOrder(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable Long routineId,
      @RequestBody RoutineOrderUpdateRequest request) {

    Long userId = userPrincipal.getId();
    routineService.updateRoutineOrders(userId, routineId, request);

    return ResponseEntity.ok().build();
  }

  // 메인 루틴으로 설정
  @PatchMapping("/{routineId}/main")
  public ResponseEntity<Void> setMainRoutine(
      @PathVariable Long routineId,
      @AuthenticationPrincipal UserPrincipal userPrincipal) {

    Long userId = userPrincipal.getId();
    routineService.setMainRoutine(userId, routineId);
    return ResponseEntity.ok().build();
  }

  // 루틴 목록 조회

  // 루틴 상세정보 조회
  @GetMapping("/{routineId}")
  public ResponseEntity<RoutineResponse> getRoutineDetails(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable Long routineId) {

    Long userId = userPrincipal.getId();
    RoutineResponse response = routineService.getRoutineDetails(userId, routineId);
    return ResponseEntity.ok(response);
  }

  // 루틴 삭제
  @DeleteMapping("/{routineId}")
  public ResponseEntity<Void> deleteRoutine(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable Long routineId) {

    Long userId = userPrincipal.getId();
    routineService.deleteRoutine(userId, routineId);

    return ResponseEntity.noContent().build(); // 204 No Content 반환 (성공적으로 삭제됨)
  }
}

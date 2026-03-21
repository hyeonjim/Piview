package com.piview.backend.domain.routine.core.controller;

import com.piview.backend.domain.routine.core.dto.RoutineListResponse;
import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.domain.routine.core.dto.RoutineRequestDto;
import com.piview.backend.domain.routine.core.dto.RoutineResponseDto;
import com.piview.backend.domain.routine.core.service.RoutineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "루틴 관리 API", description = "피뷰(FiView) 맞춤형 스킨케어 루틴 생성 및 관리 API")
@RestController
@RequestMapping("/routines")
@RequiredArgsConstructor
public class RoutineController {
  private final RoutineService routineService;

  // 루틴 생성 요청 DTO
  public record CreateRoutineRequest(Long userId, String title) {}

  @Operation(summary = "루틴 생성", description = "임시 장바구니(Redis)에 담긴 화장품 목록을 바탕으로 새로운 루틴을 생성합니다. (최대 6개)")
  @PostMapping
  public ApiResponse<Long> createRoutine(
      @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestBody CreateRoutineRequest request) {

    Long userId = userPrincipal.getId();
    Long routineId = routineService.createRoutine(userId, request.title());
    return ApiResponse.success(routineId);
  }

  @Operation(summary = "루틴 순서 수정", description = "특정 루틴 내에 포함된 화장품들의 사용 순서를 변경합니다.")
  @PatchMapping("/{routineId}/order")
  public ApiResponse<RoutineResponseDto.RoutineResponse> updateRoutineOrder(
      @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable Long routineId,
      @RequestBody RoutineRequestDto.RoutineOrderUpdateRequest request) {

    Long userId = userPrincipal.getId();
    RoutineResponseDto.RoutineResponse updatedRoutine = routineService.updateRoutineOrders(userId, routineId, request);

    return ApiResponse.success("루틴 순서가 성공적으로 변경되었습니다.", updatedRoutine);
  }

  @Operation(summary = "메인 루틴 조회", description = "사용자가 메인으로 설정한 단일 루틴의 상세 정보(제품 목록 포함)를 조회합니다.")
  @GetMapping("/main")
  public ApiResponse<RoutineResponseDto.RoutineResponse> getMainRoutine(
      @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal) {

    Long userId = userPrincipal.getId();
    RoutineResponseDto.RoutineResponse response = routineService.getMainRoutine(userId);

    return ApiResponse.success(response);
  }

  @Operation(summary = "메인 루틴으로 설정", description = "특정 루틴을 사용자의 메인 루틴으로 지정합니다. (기존 메인 루틴은 해제됨)")
  @PatchMapping("/{routineId}/main")
  public ApiResponse<RoutineResponseDto.RoutineResponse> setMainRoutine(
      @PathVariable Long routineId,
      @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal) {

    Long userId = userPrincipal.getId();
    RoutineResponseDto.RoutineResponse newMainRoutine = routineService.setMainRoutine(userId, routineId);
    return ApiResponse.success("메인 루틴으로 설정되었습니다.", newMainRoutine);
  }

  @Operation(summary = "루틴 전체 목록 조회", description = "사용자가 생성한 모든 루틴의 요약 리스트를 조회합니다.")
  @GetMapping
  public ApiResponse<List<RoutineListResponse>> getUserRoutines(
      @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal) {

    Long userId = userPrincipal.getId();
    List<RoutineListResponse> response = routineService.getUserRoutines(userId);

    return ApiResponse.success(response);
  }

  @Operation(summary = "루틴 상세정보 조회", description = "특정 루틴에 포함된 단계별 화장품 목록과 상세 정보를 조회합니다.")
  @GetMapping("/{routineId}")
  public ApiResponse<RoutineResponseDto.RoutineResponse> getRoutineDetails(
      @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable Long routineId) {

    Long userId = userPrincipal.getId();
    RoutineResponseDto.RoutineResponse response = routineService.getRoutineDetails(userId, routineId);
    return ApiResponse.success(response);
  }

  @Operation(summary = "루틴 삭제", description = "특정 루틴을 삭제합니다. (메인 루틴 삭제 시 다른 루틴이 자동으로 메인으로 승격됨)")
  @DeleteMapping("/{routineId}")
  public ApiResponse<Void> deleteRoutine(
      @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable Long routineId) {

    Long userId = userPrincipal.getId();
    routineService.deleteRoutine(userId, routineId);

    return ApiResponse.success("루틴이 성공적으로 삭제되었습니다.", null); // 204 No Content 반환 (성공적으로 삭제됨)
  }
}
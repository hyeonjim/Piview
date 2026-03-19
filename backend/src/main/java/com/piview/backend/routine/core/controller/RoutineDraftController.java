package com.piview.backend.routine.core.controller;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.routine.core.dto.AddDraftItemRequest;
import com.piview.backend.routine.core.dto.DraftItemDto;
import com.piview.backend.routine.core.service.RedisDraftService;
import com.piview.backend.routine.core.service.RoutineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Tag(name = "루틴 임시 장바구니 (Draft) API", description = "Redis를 활용한 루틴 생성 전 임시 데이터 관리 API")
@RestController
@RequestMapping("/routines/draft")
@RequiredArgsConstructor
public class RoutineDraftController {
  private final RedisDraftService redisDraftService;
  private final RoutineService routineService;

  @Operation(summary = "임시 장바구니 단일 제품 추가", description = "제품 ID를 받아 DB에서 상세 정보를 조회한 후 Redis 임시 장바구니에 추가합니다.")
  @PostMapping
  public ApiResponse<Void> addProductToDraft(
      @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestBody AddDraftItemRequest request) {

    Long userId = userPrincipal.getId();
    routineService.addProductToDraft(userId, request);

    return ApiResponse.success("임시 루틴에 단일 제품이 저장되었습니다.", null);
  }

  @Operation(summary = "임시 장바구니 전체 덮어쓰기", description = "프론트엔드에서 제품 추가, 삭제, 순서 변경 시 현재 화면의 전체 리스트를 받아 Redis 데이터를 덮어씌웁니다.")
  @PutMapping
  public ApiResponse<Void> saveDraft(
      @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestBody List<DraftItemDto> draftItems) {

    Long userId = userPrincipal.getId();
    redisDraftService.saveDraftItems(userId, draftItems);
    List<DraftItemDto> currentDraft = redisDraftService.getDraftItems(userId);

    return ApiResponse.success("임시 루틴 변경사항이 저장되었습니다.", null);
  }

  @Operation(summary = "임시 장바구니 조회", description = "현재 Redis에 임시 저장되어 있는 루틴 작성 중인 제품 목록을 조회합니다.")
  @GetMapping
  public ApiResponse<List<DraftItemDto>> getDraft(
      @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal) {

    Long userId = userPrincipal.getId();
    List<DraftItemDto> currentDraft = redisDraftService.getDraftItems(userId);

    return ApiResponse.success(currentDraft);
  }

  @Operation(summary = "임시 장바구니 단일 제품 삭제", description = "Redis 임시 장바구니 목록에서 특정 화장품(productId) 하나만 삭제합니다.")
  @DeleteMapping("/{productId}")
  public ApiResponse<Void> removeProductFromDraft(
      @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable Long productId) {

    Long userId = userPrincipal.getId();
    redisDraftService.removeProductFromDraft(userId, productId);

    return ApiResponse.success("제품이 임시 루틴에서 삭제되었습니다.", null);
  }

  @Operation(summary = "임시 장바구니 초기화", description = "루틴 작성을 취소하거나 완료했을 때, 해당 유저의 Redis 임시 데이터를 모두 지웁니다.")
  @DeleteMapping
  public ApiResponse<Void> clearDraft(
      @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal) {

    Long userId = userPrincipal.getId();
    redisDraftService.clearDraft(userId);

    return ApiResponse.success("장바구니가 초기화되었습니다.", null);
  }
}
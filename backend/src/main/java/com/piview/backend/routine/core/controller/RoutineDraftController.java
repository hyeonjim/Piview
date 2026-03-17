package com.piview.backend.routine.core.controller;

import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.routine.core.dto.AddDraftItemRequest;
import com.piview.backend.routine.core.dto.DraftItemDto;
import com.piview.backend.routine.core.service.RedisDraftService;
import com.piview.backend.routine.core.service.RoutineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/routines/draft")
@RequiredArgsConstructor
public class RoutineDraftController {
  private final RedisDraftService redisDraftService;
  private final RoutineService routineService;

  // redis에 제품 추가
  @PostMapping
  public ResponseEntity<Void> addProductToDraft(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestBody AddDraftItemRequest request) {

    Long userId = userPrincipal.getId();
    routineService.addProductToDraft(userId, request);

    return ResponseEntity.ok().build();
  }

  // redis에 화장품 목록 업데이트 (프론트에서 제품 추가,삭제,순서변경시 전체 리스트 덮어씌우기)
  @PutMapping
  public ResponseEntity<Void> saveDraft(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestBody List<DraftItemDto> draftItems) {

    Long userId = userPrincipal.getId();
    redisDraftService.saveDraftItems(userId, draftItems);

    return ResponseEntity.ok().build();
  }

  // 레디스 조회
  @GetMapping
  public ResponseEntity<List<DraftItemDto>> getDraft(
      @AuthenticationPrincipal UserPrincipal userPrincipal) {

    Long userId = userPrincipal.getId();
    List<DraftItemDto> currentDraft = redisDraftService.getDraftItems(userId);

    return ResponseEntity.ok(currentDraft);
  }

  // 레디스 속 단일제품 삭제
  @DeleteMapping("/{productId}")
  public ResponseEntity<Void> removeProductFromDraft(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable Long productId) {

    Long userId = userPrincipal.getId();
    routineService.removeProductFromDraft(userId, productId);

    return ResponseEntity.ok().build();
  }

  // 레디스 초기화
  @DeleteMapping
  public ResponseEntity<Void> clearDraft(
      @AuthenticationPrincipal UserPrincipal userPrincipal) {

    Long userId = userPrincipal.getId();
    redisDraftService.clearDraft(userId);

    return ResponseEntity.ok().build();
  }
}

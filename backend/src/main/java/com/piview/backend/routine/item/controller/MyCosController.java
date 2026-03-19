package com.piview.backend.routine.item.controller;

import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.routine.item.dto.MyCosCreateRequestDto;
import com.piview.backend.routine.item.dto.MyCosResponseDto;
import com.piview.backend.routine.item.service.MyCosService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import com.piview.backend.global.exception.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "보유제품 (MyCos) API", description = "내 보유제품 관리 및 조회 API")
@RestController
@RequestMapping("/my-cos")
@RequiredArgsConstructor
public class MyCosController {

    private final MyCosService myCosService;

    @Operation(summary = "보유제품 목록 조회", description = "로그인한 사용자가 보유한 화장품 목록을 조회합니다. (피부 타입 1, 2순위 포함)")
    @GetMapping
    public ApiResponse<List<MyCosResponseDto>> getMyCosList(
        @Parameter(hidden = true)
        @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long userId = userPrincipal.getId();

        // 해당 유저의 리스트만 조회
        List<MyCosResponseDto> response = myCosService.getMyCosList(userId);
        return ApiResponse.success(response);
    }

    @Operation(summary = "보유제품 등록", description = "사용자가 새로운 제품을 보유 제품 목록에 추가합니다.")
    @PostMapping("/{productId}")
    public ApiResponse<Long> saveMyCos(
        @Parameter(hidden = true)
        @AuthenticationPrincipal UserPrincipal userPrincipal,
        @PathVariable("productId") Long productId) {
        Long userId = userPrincipal.getId();

        // 저장 후 생성된 MyCos 테이블의 ID를 반환
        Long savedMyCosId = myCosService.saveMyCos(userId, productId);

        return ApiResponse.success(savedMyCosId);
    }

    @Operation(summary = "보유제품 삭제", description = "사용자의 보유 제품 목록에서 특정 제품을 삭제합니다.")
    @DeleteMapping("/{myCosId}")
    public ApiResponse<Void> deleteMyCos(
        @PathVariable("myCosId") Long myCosId,
        @Parameter(hidden = true)
        @AuthenticationPrincipal UserPrincipal userPrincipal) {
        // 서비스로 로그인한 유저 ID와 삭제할 제품 ID를 함께 넘기기
        myCosService.deleteMyCos(userPrincipal.getId(), myCosId);

        return ApiResponse.success("제품이 성공적으로 삭제되었습니다.", null);
    }
}
package com.piview.backend.routine.item.controller;

import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.routine.item.dto.MyCosResponseDto;
import com.piview.backend.routine.item.service.MyCosService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/my-cos")
@RequiredArgsConstructor
public class MyCosController {

    private final MyCosService myCosService;

    @GetMapping
    public ResponseEntity<List<MyCosResponseDto>> getMyCosList(
            // UserPrincipal을 주입
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {

        Long userId = userPrincipal.getId();

        // 해당 유저의 리스트만 조회
        List<MyCosResponseDto> response = myCosService.getMyCosList(userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{myCosId}")
    public ResponseEntity<String> deleteMyCos(
        @PathVariable("myCosId") Long myCosId,
        @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        // 서비스로 로그인한 유저 ID와 삭제할 제품 ID를 함께 넘기기
        myCosService.deleteMyCos(userPrincipal.getId(), myCosId);

        return ResponseEntity.ok("제품이 성공적으로 삭제되었습니다.");
    }
}
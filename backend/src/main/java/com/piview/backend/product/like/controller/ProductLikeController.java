package com.piview.backend.product.like.controller;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.global.security.UserPrincipal;
import com.piview.backend.product.catalog.dto.ProductSummaryResponse;
import com.piview.backend.product.like.dto.ProductLikeResponseDto;
import com.piview.backend.product.like.service.ProductLikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "제품 좋아요 (찜하기) API", description = "제품 좋아요 토글 및 조회 API")
@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductLikeController {
  private final ProductLikeService productLikeService;

  @Operation(summary = "제품 좋아요 토글", description = "제품의 좋아요 상태를 변경합니다. (없으면 추가, 있으면 취소)")
  @PostMapping("/{productId}/likes/toggle")
  public ApiResponse<ProductLikeResponseDto> toggleProductLike(
      @PathVariable("productId") Long productId,
      @AuthenticationPrincipal UserPrincipal userPrincipal) {

    // 서비스 로직 호출 (추가됐으면 true, 취소됐으면 false 리턴됨)
    boolean isLiked = productLikeService.toggleLike(userPrincipal.getId(), productId);

    // 결과에 따라 프론트엔드에 내려줄 메시지 세팅
    String message = isLiked ? "제품을 찜했습니다. ❤️" : "찜하기가 취소되었습니다. 🤍";

    // DTO에 담아서 200 OK와 함께 예쁘게 리턴!
    return ApiResponse.success(new ProductLikeResponseDto(isLiked, message));
  }

  @Operation(summary = "찜한 제품 목록 조회", description = "내가 좋아요(찜) 누른 화장품 목록을 전체 조회합니다.")
  @GetMapping("/likes")
  public ApiResponse<List<ProductSummaryResponse>> getMyLikedProducts(
      @AuthenticationPrincipal UserPrincipal userPrincipal) {

    Long userId = userPrincipal.getId();

    // 서비스 호출해서 잘 깎아둔 DTO 리스트 받아오기
    List<ProductSummaryResponse> result = productLikeService.getMyLikedProducts(userId);

    return ApiResponse.success(result);
  }

}

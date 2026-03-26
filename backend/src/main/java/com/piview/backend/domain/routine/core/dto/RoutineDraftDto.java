package com.piview.backend.domain.routine.core.dto;

import com.piview.backend.domain.product.catalog.dto.ProductSummaryResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

public class RoutineDraftDto {
  public record AddDraftItemRequest(
      @Schema(description = "제품 카테고리 (예: 클렌저:1, 쉐이빙:2, 스킨/토너/패드/미스트:3, 세럼/에센스/앰플:4,로션/에멀전/올인원:5, 크림/오일:6, 선크림:7)", example = "1")
      Integer columnId,
      @Schema(description = "추가할 제품 ID", example = "957")
      Long productId
  ) {}

  public record DraftItemDto(
      Integer columnId,
      Integer stepOrder,
      ProductSummaryResponse product
  ) {}

  public record EditRoutineLoadResponse(
      Long routineId,
      String title,
      List<DraftItemDto> draftItems
  ) {}

}

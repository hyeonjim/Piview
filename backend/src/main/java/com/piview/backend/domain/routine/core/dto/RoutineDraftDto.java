package com.piview.backend.domain.routine.core.dto;

import com.piview.backend.domain.product.catalog.dto.ProductSummaryResponse;

public class RoutineDraftDto {
  public record AddDraftItemRequest(
      Integer columnId,
      Long productId
  ) {}

  public record DraftItemDto(
      Integer columnId,
      Integer stepOrder,
      ProductSummaryResponse product
  ) {}

}

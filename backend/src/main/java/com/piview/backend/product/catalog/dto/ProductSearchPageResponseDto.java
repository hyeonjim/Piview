package com.piview.backend.product.catalog.dto;

import java.util.List;
import lombok.Builder;

@Builder
public record ProductSearchPageResponseDto(
    List<ProductSearchResponseDto> products,
    Boolean hasNext,
    int page,
    int size
) {

}

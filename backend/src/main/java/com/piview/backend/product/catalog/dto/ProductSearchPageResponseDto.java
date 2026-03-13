package com.piview.backend.product.catalog.dto;

import java.util.List;
import lombok.Builder;

@Builder
public record ProductSearchPageResponseDto(
    List<ProductSearchResponseDto> products, // 이름 변경된 DTO 리스트
    Boolean hasNext,
    int page,
    int size
) {

}

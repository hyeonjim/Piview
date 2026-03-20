package com.piview.backend.domain.product.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class CategoryFilterDto {

    private Long categoryId;
    private String categoryName;
}

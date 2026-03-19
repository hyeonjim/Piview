package com.piview.backend.product.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class BigCategoryFilterDto {

    private Integer bigCategoryId;
    private String bigCategoryName;
    private List<CategoryFilterDto> categories;
}

package com.piview.backend.product.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class ProductFilterMetaResponse {
    private List<BigCategoryFilterDto> bigCategories;
    private List<BrandFilterDto> brands;
    private List<TagFilterDto> tags;
}

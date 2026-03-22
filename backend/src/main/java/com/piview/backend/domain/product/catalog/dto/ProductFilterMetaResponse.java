package com.piview.backend.domain.product.catalog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("tags")
    private List<ConcernFilterDto> concerns;
}

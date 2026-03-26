package com.piview.backend.domain.product.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class BrandFilterDto {

    private Long brandId;
    private String brandName;
}

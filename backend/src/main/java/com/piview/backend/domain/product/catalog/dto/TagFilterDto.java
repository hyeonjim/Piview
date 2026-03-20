package com.piview.backend.domain.product.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class TagFilterDto {

    private Long tagId;
    private String tag;
}

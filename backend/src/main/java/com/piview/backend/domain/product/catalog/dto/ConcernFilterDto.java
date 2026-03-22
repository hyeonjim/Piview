package com.piview.backend.domain.product.catalog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ConcernFilterDto {

    @JsonProperty("tagId")
    private Long concernId;

    @JsonProperty("tag")
    private String concernName;
}

package com.piview.backend.domain.product.recommand.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RedisRoutineItemDto {
    private Integer columnId;
    private Integer stepOrder;
    private RedisProductDto product;

    @Getter
    @NoArgsConstructor
    public static class RedisProductDto {
        private Long productId;
    }
}

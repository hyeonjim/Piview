package com.piview.backend.domain.product.compare.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ProductCompareRequest {

    @NotNull(message = "productIds는 필수입니다.")
    @Size(min = 2, max = 2, message = "productIds는 정확히 2개여야 합니다.")
    private List<Long> productIds;
}

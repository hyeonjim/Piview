package com.piview.backend.domain.product.compare.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@Schema(description = "상품 비교 요청 DTO")
public class ProductCompareRequest {

    @NotNull(message = "productIds는 필수입니다.")
    @Size(min = 2, max = 2, message = "productIds는 정확히 2개여야 합니다.")
    @Schema(
            description = "비교할 상품 ID 2개 (중복 불가)",
            example = "[1425, 1436]",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private List<Long> productIds;
}

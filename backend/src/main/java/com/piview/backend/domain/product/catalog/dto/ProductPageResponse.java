package com.piview.backend.domain.product.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class ProductPageResponse {

    private List<ProductSummaryResponse> products;  // 상품 목록
    private Boolean hasNext;    // 다음 페이지 존재 여부
    private int page;   // 현재 페이지 번호
    private int size;   // 페이지 크기
    private long totalCount;    // 토탈 페이지 수
}

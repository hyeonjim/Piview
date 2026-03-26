package com.piview.backend.domain.product.catalog.dto;

import com.piview.backend.domain.skin.common.SkinTypeEnum;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ProductSearchCondition {

    private String q;   // 제품명, 브랜드 통합 검색

    private Integer bigCategoryId;
//    private Long categoryId;
    private List<Long> categoryId;
//    private String skinType;
    private SkinTypeEnum skinType;
    private List<Long> concernIds;
    private List<Long> brandIds;
    private Integer minPrice;
    private Integer maxPrice;

    @Builder.Default
    private int page = 0;

    @Builder.Default
    private int size = 10;


}

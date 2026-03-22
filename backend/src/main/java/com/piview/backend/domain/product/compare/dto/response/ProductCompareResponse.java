package com.piview.backend.domain.product.compare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class ProductCompareResponse {

    private List<ComparedProduct> products;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class ComparedProduct {
        private Long productId;
        private String name;
        private String imageUrl;
        private Integer price;
        private String brand;
        private List<String> skinTypes;
        private List<String> skinConcerns;
        private EwgRisk ewgRisk;
        private Allergy allergy;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class EwgRisk {
        private int low;
        private int medium;
        private int high;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Allergy {
        private int count;
        private List<String> ingredients;
    }
}

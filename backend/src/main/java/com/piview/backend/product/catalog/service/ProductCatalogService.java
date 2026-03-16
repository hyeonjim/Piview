package com.piview.backend.product.catalog.service;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.product.catalog.dto.ProductPageResponse;
import com.piview.backend.product.catalog.dto.ProductSearchCondition;
import com.piview.backend.product.catalog.dto.ProductSummaryResponse;
import com.piview.backend.product.catalog.repository.ProductSearchRepository;
import com.piview.backend.product.entity.Product;
import com.piview.backend.product.entity.SkinTypeEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProductCatalogService {

    private final ProductSearchRepository productSearchRepository;

    public ProductPageResponse searchProducts(ProductSearchCondition condition) {

        validate(condition);

        String normalizedQ = normalizeQ(condition.getQ());
        String normalizedSkinType = normalizeSkinType(condition.getSkinType());
        List<Long> normalizedTagIds = distinctOrNull(condition.getTagIds());
        List<Long> normalizedBrandIds = distinctOrNull(condition.getBrandIds());

        ProductSearchCondition normalized = ProductSearchCondition.builder()
                .q(normalizedQ)
                .bigCategoryId(condition.getBigCategoryId())
                .categoryId(condition.getCategoryId())
                .skinType(normalizedSkinType)
                .tagIds(normalizedTagIds)
                .brandIds(normalizedBrandIds)
                .minPrice(condition.getMinPrice())
                .maxPrice(condition.getMaxPrice())
                .page(condition.getPage())
                .size(condition.getSize())
                .build();

        PageRequest pageable = PageRequest.of(normalized.getPage(), normalized.getSize());
        Slice<Product> productSlice = productSearchRepository.search(normalized, pageable);

        List<ProductSummaryResponse> responses = productSlice.getContent().stream()
                .map(ProductSummaryResponse::from)
                .toList();

        return ProductPageResponse.builder()
                .products(responses)
                .hasNext(productSlice.hasNext())
                .page(normalized.getPage())
                .size(normalized.getSize())
                .build();
    }

    private void validate(ProductSearchCondition condition) {
        if (condition.getMinPrice() != null && condition.getMaxPrice() != null
                && condition.getMinPrice() > condition.getMaxPrice()) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        if (condition.getSkinType() != null && !condition.getSkinType().isBlank() && !"전체".equals(condition.getSkinType())) {
            try {
                SkinTypeEnum.valueOf(condition.getSkinType().toLowerCase());
            } catch (IllegalArgumentException e) {
                throw new CustomException(ErrorCode.INVALID_REQUEST);
            }
        }
    }

    private String normalizeQ(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        return q.trim();
    }

    private String normalizeSkinType(String skinType) {
        if (skinType == null || skinType.isBlank() || "전체".equals(skinType)) {
            return null;
        }
        return skinType.toUpperCase();
    }

    private List<Long> distinctOrNull(List<Long> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        return values.stream().distinct().toList();
    }
}

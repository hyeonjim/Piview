package com.piview.backend.product.service;

import com.piview.backend.product.dto.ProductPageResponse;
import com.piview.backend.product.dto.ProductSummaryResponse;
import com.piview.backend.product.entity.Product;
import com.piview.backend.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public ProductPageResponse searchProducts(
            String name, String brand,
            Long categoryId, Integer bigCategoryId,
            String skinType, List<Long> tagIds,
            int page, int size) {

        // size+1개 조회 (hasNext 판단용)
        List<Product> products = productRepository.findByConditions(
                name, brand, categoryId, bigCategoryId, skinType, tagIds, page, size);

        // hasNext 판단 후 size개로 자르기
        boolean hasNext = products.size() > size;
        if (hasNext) {
            products = new ArrayList<>(products.subList(0, size));
        }

        // Entity → DTO 변환
        List<ProductSummaryResponse> responses = products.stream()
                .map(ProductSummaryResponse::from)
                .collect(Collectors.toList());

        // 페이지 응답 조립
        return ProductPageResponse.builder()
                .products(responses)
                .hasNext(hasNext)
                .page(page)
                .size(size)
                .build();
    }
}
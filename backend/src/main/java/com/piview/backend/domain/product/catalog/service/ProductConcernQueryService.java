package com.piview.backend.domain.product.catalog.service;

import com.piview.backend.domain.product.catalog.repository.ProductConcernCacheRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProductConcernQueryService {

    private final ProductConcernCacheRepository productConcernCacheRepository;

    public Map<Long, List<String>> buildConcernsByProductIds(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<ProductConcernCacheRepository.ConcernView> rows = productConcernCacheRepository.findConcernViewsByProductIds(productIds);

        Map<Long, List<String>> result = new LinkedHashMap<>();
        for (ProductConcernCacheRepository.ConcernView row : rows) {
            result.computeIfAbsent(row.getProductId(), key -> new ArrayList<>());
            List<String> concerns = result.get(row.getProductId());

            if (!concerns.contains(row.getConcernName())) {
                concerns.add(row.getConcernName());
            }
        }

        return result;
    }

    public List<String> resolveConcernsForProduct(Long productId) {
        return buildConcernsByProductIds(List.of(productId))
                .getOrDefault(productId, List.of());
    }
}

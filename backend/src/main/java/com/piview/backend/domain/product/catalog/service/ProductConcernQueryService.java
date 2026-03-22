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

    // 안티에이징을 위한 코드 수정
    // 현재 주름/탄력, 노화방지의 db상 id가 5, 6이어서 얘네를 안티에이징으로 묶는다.
    public static final long ANTI_AGING_LINKED_ID_1 = 5L;   // 주름/탄력
    public static final long ANTI_AGING_LINKED_ID_2 = 6L;   // 노화방지-40대이상
    public static final String ANTI_AGING_NAME = "안티에이징";

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

            // 5/6(또는 해당 이름)이면 "안티에이징"으로 통합
            String normalizedConcernName = normalizeConcernName(row.getConcernId(), row.getConcernName());
            if (normalizedConcernName == null || normalizedConcernName.isBlank()) {
                continue;
            }

            if (!concerns.contains(normalizedConcernName)) {
                concerns.add(normalizedConcernName);
            }
        }

        return result;
    }

    public List<String> resolveConcernsForProduct(Long productId) {
        return buildConcernsByProductIds(List.of(productId))
                .getOrDefault(productId, List.of());
    }

    // 검색 조건 수정: 5 or 6 중 하나만 들어와도 둘 다 포함하도록 확장
    public static List<Long> normalizeConcernIdsForSearch(List<Long> concernIds) {
        if (concernIds == null || concernIds.isEmpty()) {
            return null;
        }

        LinkedHashSet<Long> normalized = new LinkedHashSet<>(concernIds);
        boolean hasAntiAgingLinked1 = normalized.contains(ANTI_AGING_LINKED_ID_1);
        boolean hasAntiAgingLinked2 = normalized.contains(ANTI_AGING_LINKED_ID_2);

        if (hasAntiAgingLinked1 || hasAntiAgingLinked2) {
            normalized.add(ANTI_AGING_LINKED_ID_1);
            normalized.add(ANTI_AGING_LINKED_ID_2);
        }

        return new ArrayList<>(normalized);
    }

    // id/이름 기준으로 안티에이징 묶음 여부 판단
    public static boolean isAntiAgingConcern(Long concernId, String concernName) {
        return Objects.equals(concernId, ANTI_AGING_LINKED_ID_1)
                || Objects.equals(concernId, ANTI_AGING_LINKED_ID_2)
                || "주름/탄력".equals(concernName)
                || "노화방지-40대이상".equals(concernName)
                || ANTI_AGING_NAME.equals(concernName);
    }

    // 응답 concern name 정규화
    private String normalizeConcernName(Long concernId, String concernName) {
        if (isAntiAgingConcern(concernId, concernName)) {
            return ANTI_AGING_NAME;
        }
        return concernName;
    }
}

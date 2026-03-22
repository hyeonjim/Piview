package com.piview.backend.domain.product.compare.service;

import com.piview.backend.domain.product.catalog.repository.IngredientRepository;
import com.piview.backend.domain.product.catalog.repository.ProductIngredientRepository;
import com.piview.backend.domain.product.catalog.repository.ProductRepository;
import com.piview.backend.domain.product.catalog.service.ProductConcernQueryService;
import com.piview.backend.domain.product.compare.dto.response.ProductCompareResponse;
import com.piview.backend.domain.product.entity.EwgGrade;
import com.piview.backend.domain.product.entity.Ingredient;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.product.entity.ProductIngredients;
import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProductCompareService {

    private final ProductRepository productRepository;
    private final ProductIngredientRepository productIngredientRepository;
    private final IngredientRepository ingredientRepository;
    private final ProductConcernQueryService productConcernQueryService;

    public ProductCompareResponse compareProducts(List<Long> rawProductIds) {

        // validateAndNormalize: 2개, 중복 금지
        List<Long> productIds = validateAndNormalize(rawProductIds);

        // 비교 대상 상품 조회
        List<Product> products = productRepository.findByProductIdIn(productIds);
        if (products.size() != 2) {
            throw new CustomException(ErrorCode.COSMETICS_NOT_FOUND);
        }

        Map<Long, Product> productById = products.stream()
                .collect(Collectors.toMap(Product::getProductId, Function.identity()));

        // 상품별 성분 문자열 조회
        List<ProductIngredients> piList = productIngredientRepository.findByProductIds(productIds);
        Map<Long, ProductIngredients> piByProductId = piList.stream()
                .collect(Collectors.toMap(ProductIngredients::getProductId, Function.identity()));

        // 상품별 피부고민 태그 조회
        Map<Long, List<String>> concernsByProductId = productConcernQueryService.buildConcernsByProductIds(productIds);

        // 모든 상품의 성분명을 모아서 ingredient 테이블 한 번에 조회
        Set<String> namesForLookup = new LinkedHashSet<>();
        for (Long productId : productIds) {
            ProductIngredients pi = piByProductId.get(productId);
            namesForLookup.addAll(splitIngredients(pi != null ? pi.getProductIngredientsKo() : null));
            namesForLookup.addAll(splitIngredients(pi != null ? pi.getProductIngredientsEn() : null));
        }

        List<Ingredient> matchedIngredients = namesForLookup.isEmpty() ? List.of() : ingredientRepository.findAllByNames(namesForLookup);

        Map<String, Ingredient> ingredientByKo = new HashMap<>();
        Map<String, Ingredient> ingredientByEn = new HashMap<>();
        for (Ingredient ingredient : matchedIngredients) {
            if (ingredient.getNameKo() != null) {
                ingredientByKo.put(ingredient.getNameKo(), ingredient);
            }
            if (ingredient.getNameEn() != null) {
                ingredientByEn.put(ingredient.getNameEn(), ingredient);
            }
        }

        // 응답 DTO 만들기
        List<ProductCompareResponse.ComparedProduct> comparedProducts = new ArrayList<>();
        for (Long productId : productIds) {
            Product product = productById.get(productId);
            if (product == null) {
                throw new CustomException(ErrorCode.COSMETICS_NOT_FOUND);
            }

            ProductIngredients pi = piByProductId.get(productId);

            // 성분 리스트를 기준으로 EWG(low/medium/high) 집계, 알레르기 성분 추출
            IngredientSummary summary = summarizeIngredients(pi, ingredientByKo, ingredientByEn);

            comparedProducts.add(ProductCompareResponse.ComparedProduct.builder()
                    .productId(product.getProductId())
                    .name(product.getName())
                    .imageUrl(product.getImage() != null ? product.getImage().getUrl() : null)
                    .price(product.getPrice())
                    .brand(product.getBrand() != null ? product.getBrand().getBrandName() : null)
                    .skinTypes(extractSkinTypes(product))
                    .skinConcerns(concernsByProductId.getOrDefault(productId, List.of()))
                    .ewgRisk(ProductCompareResponse.EwgRisk.builder()
                            .low(summary.lowCount())
                            .medium(summary.mediumCount())
                            .high(summary.highCount())
                            .build())
                    .allergy(ProductCompareResponse.Allergy.builder()
                            .count(summary.allergenIngredients().size())
                            .ingredients(summary.allergenIngredients())
                            .build())
                    .build());
        }

        return ProductCompareResponse.builder()
                .products(comparedProducts)
                .build();
    }

    // 중복 제거 결과 반환
    private List<Long> validateAndNormalize(List<Long> rawProductIds) {
        if (rawProductIds == null || rawProductIds.size() != 2) {
            throw new CustomException(ErrorCode.PRODUCT_COMPARE_REQUIRES_TWO_IDS);
        }

        List<Long> distinctIds = rawProductIds.stream().distinct().toList();
        if (distinctIds.size() != 2) {
            throw new CustomException(ErrorCode.PRODUCT_COMPARE_DUPLICATE_IDS);
        }

        return distinctIds;
    }

    private List<String> extractSkinTypes(Product product) {
        return Stream.of(product.getTopSkinType(), product.getTop2SkinType())
                .filter(Objects::nonNull)
                .map(Enum::name)
                .distinct()
                .toList();
    }

    private IngredientSummary summarizeIngredients(
            ProductIngredients pi,
            Map<String, Ingredient> ingredientByKo,
            Map<String, Ingredient> ingredientByEn
    ) {
        List<String> koList = splitIngredients(pi != null ? pi.getProductIngredientsKo() : null);
        List<String> enList = splitIngredients(pi != null ? pi.getProductIngredientsEn() : null);

        // 한글, 영문 길이가 다를 수 있다는 전제 하에 더 긴쪽을 돌게 한다.
        int itemCount = Math.max(koList.size(), enList.size());

        int lowCount = 0;
        int mediumCount = 0;
        int highCount = 0;

        // 중복 알레르기 성분 명 제외를 위해 set 적용
        Set<String> allergenNames = new LinkedHashSet<>();

        for (int i = 0; i < itemCount; i++) {
            String nameKo = i < koList.size() ? koList.get(i) : null;
            String nameEn = i < enList.size() ? enList.get(i) : null;

            // 우선 한글명으로 매칭을 시도하고 실패한다면 영문명으로 시도
            Ingredient ingredient = null;
            if (nameKo != null) {
                ingredient = ingredientByKo.get(nameKo);
            }
            if (ingredient == null && nameEn != null) {
                ingredient = ingredientByEn.get(nameEn);
            }

            EwgGrade ewgGrade = ingredient != null ? ingredient.getEwgGrade() : null;
            if (ewgGrade == EwgGrade.low) {
                lowCount++;
            } else if (ewgGrade == EwgGrade.medium) {
                mediumCount++;
            } else if (ewgGrade == EwgGrade.high) {
                highCount++;
            }

            boolean isAllergen = ingredient != null && Boolean.TRUE.equals(ingredient.getHasAllergen());
            if (isAllergen) {
                allergenNames.add(nameKo != null ? nameKo : nameEn);
            }
        }

        return new IngredientSummary(lowCount, mediumCount, highCount, new ArrayList<>(allergenNames));
    }

    private List<String> splitIngredients(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }

        String normalized = raw.trim();
        if (normalized.startsWith("'") && normalized.endsWith("'") && normalized.length() >= 2) {
            normalized = normalized.substring(1, normalized.length() - 1);
        }

        return Arrays.stream(normalized.split("'\\s*,\\s*'"))
                .map(String::trim)
                .map(s -> s.replaceAll("^'+|'+$", ""))
                .filter(s -> !s.isBlank())
                .toList();
    }

    // 성분 계산 중간 결과를 묶어 메서드 반환값 가독성 개선
    // 이거 처음써보는데 record가 그렇게 좋다네요...
    private record IngredientSummary(
            int lowCount,
            int mediumCount,
            int highCount,
            List<String> allergenIngredients
    ) {}
}

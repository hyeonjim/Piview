package com.piview.backend.product.catalog.service;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.product.catalog.dto.*;
import com.piview.backend.product.catalog.repository.AllergenRepository;
import com.piview.backend.product.catalog.repository.ProductIngredientRepository;
import com.piview.backend.product.catalog.repository.ProductRepository;
import com.piview.backend.product.entity.EwgGrade;
import com.piview.backend.product.entity.Ingredient;
import com.piview.backend.product.entity.Product;
import com.piview.backend.product.entity.ProductIngredient;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;


@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProductCatalogService {

    private final ProductRepository productRepository;
    private final ProductIngredientRepository productIngredientRepository;
    private final AllergenRepository allergenRepository;

    // 검색, 카테고리 별 조회
    public ProductPageResponse searchProducts(ProductSearchCondition condition) {

        validate(condition);

        String normalizedQ = normalizeQ(condition.getQ());
        List<Long> normalizedTagIds = distinctOrNull(condition.getTagIds());
        List<Long> normalizedBrandIds = distinctOrNull(condition.getBrandIds());

        ProductSearchCondition normalized = ProductSearchCondition.builder()
                .q(normalizedQ)
                .bigCategoryId(condition.getBigCategoryId())
                .categoryId(condition.getCategoryId())
                .skinType(condition.getSkinType())
                .tagIds(normalizedTagIds)
                .brandIds(normalizedBrandIds)
                .minPrice(condition.getMinPrice())
                .maxPrice(condition.getMaxPrice())
                .page(condition.getPage())
                .size(condition.getSize())
                .build();

        PageRequest pageable = PageRequest.of(normalized.getPage(), normalized.getSize());
        Slice<Product> productSlice = productRepository.search(normalized, pageable);

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
    }

    private String normalizeQ(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        return q.trim();
    }

    private List<Long> distinctOrNull(List<Long> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        return values.stream().distinct().toList();
    }

    // 상품 상세 조회
    public ProductDetailResponse getProductDetail(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new CustomException(ErrorCode.COSMETICS_NOT_FOUND));

        List<ProductIngredient> productIngredients = productIngredientRepository.findByProductId(productId);

        List<Long> ingredientIds = productIngredients.stream()
                .map(ProductIngredient::getIngredient)
                .filter(Objects::nonNull)
                .map(Ingredient::getIngredientId)
                .toList();

        Set<Long> allergenIngredientIds = new HashSet<>(
                ingredientIds.isEmpty() ? List.of() : allergenRepository.findAllergenIngredientIds(ingredientIds)
        );

        // low, medium, high, unknown 카운트 계산
        int lowCount = 0;
        int mediumCount = 0;
        int highCount = 0;
        int unknownCount = 0;

        List<String> cautionIngredients = new ArrayList<>();
        List<String> allergenIngredients = new ArrayList<>();
        List<ProductIngredientDetailResponse> ingredients = new ArrayList<>();

        for (ProductIngredient pi : productIngredients) {
            Ingredient ingredient = pi.getIngredient();

            Long ingredientId = (ingredient != null) ? ingredient.getIngredientId() : null;
            EwgGrade ewgGrade = (ingredient != null) ? ingredient.getEwgGrade() : null;
            String functions = (ingredient != null) ? ingredient.getCoosFunctions() : null;

            boolean isAllergen = ingredientId != null && allergenIngredientIds.contains(ingredientId);

            if (ewgGrade == null) {
                unknownCount++;
            } else if (ewgGrade == EwgGrade.low) {
                lowCount++;
            } else if (ewgGrade == EwgGrade.medium) {
                mediumCount++;
            } else if (ewgGrade == EwgGrade.high) {
                highCount++;
                cautionIngredients.add(pi.getNameKo());
            }

            if (isAllergen) {
                allergenIngredientIds.add(ingredientId);
            }

            ingredients.add(ProductIngredientDetailResponse.builder()
                    .position(pi.getPosition())
                    .nameKo(pi.getNameKo())
                    .nameEn(pi.getNameEn())
                    .ewgGrade(ewgGrade)
                    .functions(functions)
                    .isAllergen(isAllergen)
                    .build());
        }

        List<String> skinTypes = new ArrayList<>();

        if (product.getSkinScore() != null) {
            if (product.getSkinScore().getTopSkinType() != null) {
                skinTypes.add(product.getSkinScore().getTopSkinType().name());
            }
            if (product.getSkinScore().getTop2SkinType() != null) {
                skinTypes.add(product.getSkinScore().getTop2SkinType().name());
            }
        }

        Map<String, Integer> skinTypeScores = new HashMap<>();

        if (product.getSkinScore() != null) {
            skinTypeScores.put("dry", toIntFloor(product.getSkinScore().getScoreDry()));
            skinTypeScores.put("oily", toIntFloor(product.getSkinScore().getScoreOily()));
            skinTypeScores.put("combination", toIntFloor(product.getSkinScore().getScoreCombination()));
            skinTypeScores.put("subuji", toIntFloor(product.getSkinScore().getScoreSubuji()));
        }

        return ProductDetailResponse.builder()
                .productId(product.getProductId())
                .imageUrl(product.getImage() != null ? product.getImage().getUrl() : null)
                .brandName(product.getBrand() != null ? product.getBrand().getBrandName() : null)
                .productName(product.getName())
                .skinTypes(skinTypes)
                .tags(null)
                .price(product.getPrice())
                .volume(product.getVolume())
                .lowCount(lowCount)
                .mediumCount(mediumCount)
                .highCount(highCount)
                .unknownCount(unknownCount)
                .cautionIngredients(cautionIngredients)
                .allergenIngredients(allergenIngredients)
                .ingredients(ingredients)
                .skinTypeScores(skinTypeScores)
                .build();
    }

    // int 변환
    private Integer toIntFloor(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value.intValue();
    }

}

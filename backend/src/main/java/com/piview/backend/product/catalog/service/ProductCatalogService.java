package com.piview.backend.product.catalog.service;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.product.catalog.dto.*;
import com.piview.backend.product.catalog.repository.*;
import com.piview.backend.product.entity.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;


@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProductCatalogService {

    // 조회를 위한 repository
    private final ProductRepository productRepository;
    private final ProductIngredientRepository productIngredientRepository;
    private final IngredientRepository ingredientRepository;

    // MetaData 제공을 위한 repository
    private final BigCategoryRepository bigCategoryRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final TagRepository tagRepository;

    // filter MetaData 제공 service
    public ProductFilterMetaResponse getFilterMeta() {

        List<BigCategory> bigCategories = bigCategoryRepository.findAllByOrderByBigCategoryIdAsc();
        List<Category> categories = categoryRepository.findAllByOrderByBigCategory_BigCategoryIdAscCategoryIdAsc();
        List<Brand> brands = brandRepository.findAllByOrderByBrandNameAsc();
        List<Tag> tags = tagRepository.findAllByOrderByTagAsc();

        Map<Integer, List<Category>> categoryMap = categories.stream()
                .collect(Collectors.groupingBy(category -> category.getBigCategory().getBigCategoryId()));

        List<BigCategoryFilterDto> bigCategoryDtos = bigCategories.stream()
                .map(bigCategory -> BigCategoryFilterDto.builder()
                        .bigCategoryId(bigCategory.getBigCategoryId())
                        .bigCategoryName(bigCategory.getBigCategoryName())
                        .categories(
                                categoryMap.getOrDefault(bigCategory.getBigCategoryId(), List.of()).stream()
                                        .map(category -> CategoryFilterDto.builder()
                                                .categoryId(category.getCategoryId())
                                                .categoryName(category.getCategoryName())
                                                .build())
                                        .toList()
                        )
                        .build())
                .toList();

        List<BrandFilterDto> brandDtos = brands.stream()
                .map(brand -> BrandFilterDto.builder()
                        .brandId(brand.getBrandId())
                        .brandName(brand.getBrandName())
                        .build())
                .toList();

        List<TagFilterDto> tagDtos = tags.stream()
                .map(tag -> TagFilterDto.builder()
                        .tagId(tag.getTagId())
                        .tag(tag.getTag())
                        .build())
                .toList();

        return ProductFilterMetaResponse.builder()
                .bigCategories(bigCategoryDtos)
                .brands(brandDtos)
                .tags(tagDtos)
                .build();
    }

    // 조회 service
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

    public ProductDetailResponse getProductDetail(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new CustomException(ErrorCode.COSMETICS_NOT_FOUND));

        ProductIngredients pi = productIngredientRepository.findByProductId(productId).orElse(null);

        List<String> koList = splitIngredients(pi != null ? pi.getProductIngredientsKo() : null);
        List<String> enList = splitIngredients(pi != null ? pi.getProductIngredientsEn() : null);

        int itemCount = Math.max(koList.size(), enList.size());

        Set<String> namesForLookup = Stream.concat(koList.stream(), enList.stream())
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.toSet());

        List<Ingredient> matchedIngredients = namesForLookup.isEmpty()
                ? List.of()
                : ingredientRepository.findAllByNames(namesForLookup);

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

        int lowCount = 0;
        int mediumCount = 0;
        int highCount = 0;
        int unknownCount = 0;

        List<String> cautionIngredients = new ArrayList<>();
        List<String> allergenIngredients = new ArrayList<>();
        List<ProductIngredientDetailResponse> ingredients = new ArrayList<>();

        for (int i = 0; i < itemCount; i++) {
            String nameKo = i < koList.size() ? koList.get(i) : null;
            String nameEn = i < enList.size() ? enList.get(i) : null;

            Ingredient ingredient = null;
            if (nameKo != null) {
                ingredient = ingredientByKo.get(nameKo);
            }
            if (ingredient == null && nameEn != null) {
                ingredient = ingredientByEn.get(nameEn);
            }

            EwgGrade ewgGrade = (ingredient != null) ? ingredient.getEwgGrade() : null;
            boolean isAllergen = ingredient != null && Boolean.TRUE.equals(ingredient.getHasAllergen());

            if (ewgGrade == null) {
                unknownCount++;
            } else if (ewgGrade == EwgGrade.low) {
                lowCount++;
            } else if (ewgGrade == EwgGrade.medium) {
                mediumCount++;
            } else if (ewgGrade == EwgGrade.high) {
                highCount++;
                cautionIngredients.add(nameKo != null ? nameKo : nameEn);
            }

            if (isAllergen) {
                allergenIngredients.add(nameKo != null ? nameKo : nameEn);
            }

            ingredients.add(ProductIngredientDetailResponse.builder()
                    .position(i + 1)
                    .nameKo(nameKo)
                    .nameEn(nameEn)
                    .ewgGrade(ewgGrade)
                    .functions(null)
                    .isAllergen(isAllergen)
                    .build());
        }

        List<String> skinTypes = new ArrayList<>();
        if (product.getTopSkinType() != null) {
            skinTypes.add(product.getTopSkinType().name());
        }
        if (product.getTop2SkinType() != null) {
            skinTypes.add(product.getTop2SkinType().name());
        }

        Map<String, Integer> skinTypeScores = new HashMap<>();
        skinTypeScores.put("dry", toIntFloor(product.getScoreDry()));
        skinTypeScores.put("oily", toIntFloor(product.getScoreOily()));
        skinTypeScores.put("combination", toIntFloor(product.getScoreCombination()));
        skinTypeScores.put("subuji", toIntFloor(product.getScoreSubuji()));

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

    private Integer toIntFloor(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value.intValue();
    }
}

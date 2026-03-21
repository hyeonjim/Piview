package com.piview.backend.domain.product.catalog.service;

import com.piview.backend.domain.product.catalog.dto.BigCategoryFilterDto;
import com.piview.backend.domain.product.catalog.dto.BrandFilterDto;
import com.piview.backend.domain.product.catalog.dto.CategoryFilterDto;
import com.piview.backend.domain.product.catalog.dto.ProductDetailResponse;
import com.piview.backend.domain.product.catalog.dto.ProductFilterMetaResponse;
import com.piview.backend.domain.product.catalog.dto.ProductIngredientDetailResponse;
import com.piview.backend.domain.product.catalog.dto.ProductPageResponse;
import com.piview.backend.domain.product.catalog.dto.ProductSearchCondition;
import com.piview.backend.domain.product.catalog.dto.ProductSummaryResponse;
import com.piview.backend.domain.product.catalog.dto.ConcernFilterDto;
import com.piview.backend.domain.product.catalog.repository.*;
import com.piview.backend.domain.product.entity.*;
import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.domain.product.like.repository.ProductLikeRepository;
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
    private final ProductLikeRepository productLikeRepository;
    private final SkinConcernsRepository skinConcernsRepository;
    private final ProductConcernCacheRepository productConcernCacheRepository;

    // filter MetaData 제공 service
    public ProductFilterMetaResponse getFilterMeta() {

        List<BigCategory> bigCategories = bigCategoryRepository.findAllByOrderByBigCategoryIdAsc();
        List<Category> categories = categoryRepository.findAllByOrderByBigCategory_BigCategoryIdAscCategoryIdAsc();
        List<Brand> brands = brandRepository.findAllByOrderByBrandNameAsc();
        List<SkinConcerns> concerns = skinConcernsRepository.findAllByOrderByIdAsc();

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

        List<ConcernFilterDto> concernDtos = concerns.stream()
                .map(concern -> ConcernFilterDto.builder()
                        .concernId(concern.getId())
                        .concernName(concern.getConcernName())
                        .build())
                .toList();

        return ProductFilterMetaResponse.builder()
                .bigCategories(bigCategoryDtos)
                .brands(brandDtos)
                .concerns(concernDtos)
                .build();
    }

    // 조회 service
    public ProductPageResponse searchProducts(ProductSearchCondition condition, Long userId) {
        validate(condition);

        String normalizedQ = normalizeQ(condition.getQ());
        List<Long> normalizedConcernIds = distinctOrNull(condition.getConcernIds());
        List<Long> normalizedBrandIds = distinctOrNull(condition.getBrandIds());

        ProductSearchCondition normalized = ProductSearchCondition.builder()
                .q(normalizedQ)
                .bigCategoryId(condition.getBigCategoryId())
                .categoryId(condition.getCategoryId())
                .skinType(condition.getSkinType())
                .concernIds(normalizedConcernIds)
                .brandIds(normalizedBrandIds)
                .minPrice(condition.getMinPrice())
                .maxPrice(condition.getMaxPrice())
                .page(condition.getPage())
                .size(condition.getSize())
                .build();

        PageRequest pageable = PageRequest.of(normalized.getPage(), normalized.getSize());
        Slice<Product> productSlice = productRepository.search(normalized, pageable);

        // total pages
        long totalCount = productRepository.count(normalized);

        List<Long> likedProductIds = (userId != null)
            ? productLikeRepository.findLikedProductIdsByUserId(userId)
            : Collections.emptyList();

        // 상품  별 concerns 조회
        List<Long> productIds = productSlice.getContent().stream()
                .map(Product::getProductId)
                .toList();

        Map<Long, List<String>> concernsByProductId = buildConcernsByProductIds(productIds);

        List<ProductSummaryResponse> responses = productSlice.getContent().stream()
            .map(product -> {
                boolean isLiked = likedProductIds.contains(product.getProductId());
                List<String> concerns =  concernsByProductId.getOrDefault(product.getProductId(), List.of());
                return ProductSummaryResponse.from(product, isLiked, concerns);
            })
            .toList();

        return ProductPageResponse.builder()
                .products(responses)
                .hasNext(productSlice.hasNext())
                .page(normalized.getPage())
                .size(normalized.getSize())
                .totalCount(totalCount)
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

    public ProductDetailResponse getProductDetail(Long productId, Long userId) {
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

        boolean isLiked = false;
        if (userId != null) {
            // 아까 레포지토리에 만들어둔 단건 조회 메서드 재활용!
            isLiked = productLikeRepository.findByUserIdAndProductId(userId, productId).isPresent();
        }

        return ProductDetailResponse.builder()
                .productId(product.getProductId())
                .imageUrl(product.getImage() != null ? product.getImage().getUrl() : null)
                .brandName(product.getBrand() != null ? product.getBrand().getBrandName() : null)
                .productName(product.getName())
                .description(product.getDescription())
                .skinTypes(skinTypes)
                .concerns(resolveConcernsForProduct(productId))
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
                .isLiked(isLiked)
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

    private Map<Long, List<String>> buildConcernsByProductIds(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<ProductConcernCacheRepository.ConcernView> rows = productConcernCacheRepository.findConcernViewsByProductIds(productIds);

        Map<Long, List<String>> result = new LinkedHashMap<>();
        for(ProductConcernCacheRepository.ConcernView row : rows) {
            result.computeIfAbsent(row.getProductId(), key -> new ArrayList<>());
            List<String> concerns = result.get(row.getProductId());

            if (!concerns.contains(row.getConcernName())) {
                concerns.add(row.getConcernName());
            }
        }
        return result;
    }

    private List<String> resolveConcernsForProduct(Long productId) {
        return buildConcernsByProductIds(List.of(productId))
                .getOrDefault(productId, List.of());
    }
}

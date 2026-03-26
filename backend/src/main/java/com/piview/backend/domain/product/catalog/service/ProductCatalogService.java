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
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;


@Slf4j
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

    // concern 가져오기 위한 service
    private final ProductConcernQueryService productConcernQueryService;

    // 벡터 검색을 위한 service
    private final ProductSearchAiClient productSearchAiClient;

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

        // 5, 6을 "안티에이징" 1개 태그로 병합해서 반환
        List<ConcernFilterDto> concernDtos = toConcernFilterDtos(concerns);

//        List<ConcernFilterDto> concernDtos = concerns.stream()
//                .map(concern -> ConcernFilterDto.builder()
//                        .concernId(concern.getId())
//                        .concernName(concern.getConcernName())
//                        .build())
//                .toList();

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

        // 기존 distinct만 하던 concernIds를 안티에이징 linked 규칙을 추가하여 정규화
        List<Long> normalizedConcernIds = normalizeConcernIds(condition.getConcernIds());
//        List<Long> normalizedConcernIds = distinctOrNull(condition.getConcernIds());

        List<Long> normalizedCategoryIds = distinctOrNull(condition.getCategoryId());

        List<Long> normalizedBrandIds = distinctOrNull(condition.getBrandIds());

        ProductSearchCondition normalized = ProductSearchCondition.builder()
                .q(normalizedQ)
                .bigCategoryId(condition.getBigCategoryId())
                .categoryId(normalizedCategoryIds)
                .skinType(condition.getSkinType())
                .concernIds(normalizedConcernIds)
                .brandIds(normalizedBrandIds)
                .minPrice(condition.getMinPrice())
                .maxPrice(condition.getMaxPrice())
                .page(condition.getPage())
                .size(condition.getSize())
                .build();

        PageRequest pageable = PageRequest.of(normalized.getPage(), normalized.getSize());

        if (normalized.getQ() != null) {
            int candidateLimit = resolveVectorCandidateLimit(normalized);
            List<Long> rankedProductIds = productSearchAiClient.searchRankedProductIds(normalized.getQ(), candidateLimit);

            if (!rankedProductIds.isEmpty()) {
                ProductSearchCondition filterOnlyCondition = ProductSearchCondition.builder()
                        .q(null) // q는 AI에서 반영
                        .bigCategoryId(normalized.getBigCategoryId())
                        .categoryId(normalized.getCategoryId())
                        .skinType(normalized.getSkinType())
                        .concernIds(normalized.getConcernIds())
                        .brandIds(normalized.getBrandIds())
                        .minPrice(normalized.getMinPrice())
                        .maxPrice(normalized.getMaxPrice())
                        .page(normalized.getPage())
                        .size(normalized.getSize())
                        .build();

                Slice<Product> vectorSlice = productRepository.searchByRankedProductIds(
                        filterOnlyCondition, rankedProductIds, pageable
                );
                long vectorTotalCount = productRepository.countByRankedProductIds(
                        filterOnlyCondition, rankedProductIds
                );

                if (!vectorSlice.isEmpty()) {
                    log.info(
                            "Product search used AI ranking: query='{}', candidateLimit={}, rankedCount={}, filteredCount={}, totalCount={}",
                            normalized.getQ(),
                            candidateLimit,
                            rankedProductIds.size(),
                            vectorSlice.getNumberOfElements(),
                            vectorTotalCount
                    );
                    return buildPageResponse(vectorSlice, normalized, vectorTotalCount, userId);
                }

                log.info(
                        "Product search AI ranking filtered out by backend filters: query='{}', candidateLimit={}, rankedCount={}",
                        normalized.getQ(),
                        candidateLimit,
                        rankedProductIds.size()
                );
            }

            log.info(
                    "Product search fallback to DB after empty AI ranking: query='{}', candidateLimit={}",
                    normalized.getQ(),
                    candidateLimit
            );
        }

        // 벡터 실패/빈 결과일 때 기존 DB 검색
        Slice<Product> fallbackSlice = productRepository.search(normalized, pageable);
        long fallBackTotalCount = productRepository.count(normalized);
        return buildPageResponse(fallbackSlice, normalized, fallBackTotalCount, userId);
    }

    private int resolveVectorCandidateLimit(ProductSearchCondition condition) {
        int pageWindow = Math.max(1, condition.getPage() + 1);
        int dynamic = condition.getSize() * (pageWindow + 2) * 10;
        return Math.min(Math.max(100, dynamic), 500);
    }

    private ProductPageResponse buildPageResponse(
            Slice<Product> productSlice,
            ProductSearchCondition condition,
            long totalCount,
            Long userId
    ) {
        List<Long> likedProductIds = (userId != null)
                ? productLikeRepository.findLikedProductIdsByUserId(userId)
                : Collections.emptyList();

        List<Long> productIds = productSlice.getContent().stream()
                .map(Product::getProductId)
                .toList();

        Map<Long, List<String>> concernsByProductId =
                productConcernQueryService.buildConcernsByProductIds(productIds);

        List<ProductSummaryResponse> responses = productSlice.getContent().stream()
                .map(product -> {
                    boolean isLiked = likedProductIds.contains(product.getProductId());
                    List<String> concerns = concernsByProductId.getOrDefault(product.getProductId(), List.of());
                    return ProductSummaryResponse.from(product, isLiked, concerns);
                })
                .toList();

        return ProductPageResponse.builder()
                .products(responses)
                .hasNext(productSlice.hasNext())
                .page(condition.getPage())
                .size(condition.getSize())
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

    // search tagIds 정규화 helper
    private List<Long> normalizeConcernIds(List<Long> concernIds) {
        List<Long> distinctConcernIds = distinctOrNull(concernIds);
        return ProductConcernQueryService.normalizeConcernIdsForSearch(distinctConcernIds);
    }

    // filter meta의 tags를 안티에이징 규칙으로 병합 helper
    private List<ConcernFilterDto> toConcernFilterDtos(List<SkinConcerns> concerns) {
        Map<Long, ConcernFilterDto> normalized = new LinkedHashMap<>();

        for (SkinConcerns concern : concerns) {
            Long concernId = concern.getId();
            String concernName = concern.getConcernName();

            if (ProductConcernQueryService.isAntiAgingConcern(concernId, concernName)) {
                normalized.putIfAbsent(
                        ProductConcernQueryService.ANTI_AGING_LINKED_ID_1,
                        ConcernFilterDto.builder()
                                .concernId(ProductConcernQueryService.ANTI_AGING_LINKED_ID_1)
                                .concernName(ProductConcernQueryService.ANTI_AGING_NAME)
                                .build()
                );

                continue;
            }

            normalized.putIfAbsent(
                    concernId,
                    ConcernFilterDto.builder()
                            .concernId(concernId)
                            .concernName(concernName)
                            .build()
            );
        }

        return new ArrayList<>(normalized.values());
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

            Integer ewgScore = null;
            if (ingredient != null && ingredient.getEwgScoreMin() != null && ingredient.getEwgScoreMax() != null) {
                ewgScore = Math.round((ingredient.getEwgScoreMin() + ingredient.getEwgScoreMax()) / 2.0f);
            }

            ingredients.add(ProductIngredientDetailResponse.builder()
                    .position(i + 1)
                    .nameKo(nameKo)
                    .nameEn(nameEn)
                    .ewgGrade(ewgGrade)
                    .ewgScore(ewgScore)
                    .functions(ingredient != null ? ingredient.getCoosFunctions() : null)
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
                .concerns(productConcernQueryService.resolveConcernsForProduct(productId))
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
}

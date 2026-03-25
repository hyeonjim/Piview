package com.piview.backend.domain.product.catalog.repository;

import java.math.BigDecimal;
import java.util.*;

import com.piview.backend.domain.product.catalog.dto.ProductSearchCondition;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.skin.common.SkinTypeEnum;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Repository;

import static com.piview.backend.domain.product.entity.QBigCategory.bigCategory;
import static com.piview.backend.domain.product.entity.QBrand.brand;
import static com.piview.backend.domain.product.entity.QCategory.category;
import static com.piview.backend.domain.product.entity.QImage.image;
import static com.piview.backend.domain.product.entity.QProduct.product;
import static com.piview.backend.domain.product.entity.QProductConcernCache.productConcernCache;
import static com.piview.backend.domain.product.dynamic.entity.QRecommendationScore.recommendationScore;

@Repository
@RequiredArgsConstructor
public class ProductRepositoryImpl implements ProductRepositoryCustom {

  private final JPAQueryFactory queryFactory;
  private final EntityManager entityManager;

  @Override
  public Slice<Product> search(ProductSearchCondition condition, Pageable pageable) {

    // 태그만 조회하는 경우에는 별도의 최적화 경로를 사용해야 한다.
    // In(subquery) 형태는 MySQL에서 dependent subquery로 풀리면 매우 느려진다.
//    if (isConcernOnlyCondition(condition)) {
//      return searchByConcernOnlyOptimized(condition, pageable);
//    }
    if (hasConcerns(condition)) {
      return searchByConcernOptimized(condition, pageable);
    }

    // 기본: 기존 QueryDSL 로직을 유지한다.
    List<Product> content = queryFactory
            .selectFrom(product)
            .join(product.brand, brand).fetchJoin()
            .join(product.image, image).fetchJoin()
            .join(product.category, category).fetchJoin()
            .join(category.bigCategory, bigCategory).fetchJoin()
            .where(buildSearchWhere(condition))
            .orderBy(product.productId.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize() + 1)
            .fetch();

    boolean hasNext = false;
    if (content.size() > pageable.getPageSize()) {
      content.remove(pageable.getPageSize());
      hasNext = true;
    }

    return new SliceImpl<>(content, pageable, hasNext);
  }

  @Override
  public long count(ProductSearchCondition condition) {
    // 태그만 조회하는 경우 count 역시 최적의 경로를 이용해야 한다.
    // COUNT + IN(subquery) 조합이 dependent subquery로 풀리면 loops 가 증식한다.
//    if (isConcernOnlyCondition(condition)) {
//      return countByConcernOnlyOptimized(condition);
//    }
    if (hasConcerns(condition)) {
      return countByConcernOptimized(condition);
    }

    // 기본: 기존 count 로직을 유지한다.
    // count 전용 query 분리 (불필요한 join 날리기)
    JPAQuery<Long> countQuery = queryFactory
            .select(product.count())
            .from(product);

    // 필요한 경우에 join
    if (needsBrandJoin(condition)) {
      countQuery.join(product.brand, brand);
    }
    if (needsCategoryJoin(condition)) {
      countQuery.join(product.category, category);
    }
    if (needsBigCategoryJoin(condition)) {
      countQuery.join(category.bigCategory, bigCategory);
    }

    Long result = countQuery
            .where(buildCountWhere(condition))
            .fetchOne();

    return result != null ? result : 0L;
  }

  @Override
  public Page<Product> findRecommendedProducts(Long userId, String userSkinType, Integer bigCategoryId, Long categoryId, Pageable pageable) {
    // ✅ 1. 유저 피부 타입에 맞춰 2순위 정렬 기준을 동적으로 결정하는 로직
    NumberExpression<BigDecimal> skinTypeScore;
    if (userSkinType != null) {
      if ("dry".equalsIgnoreCase(userSkinType)) {
        skinTypeScore = product.scoreDry;
      } else if ("oily".equalsIgnoreCase(userSkinType)) {
        skinTypeScore = product.scoreOily;
      } else if ("subuji".equalsIgnoreCase(userSkinType)) {
        skinTypeScore = product.scoreSubuji;
      } else {
        skinTypeScore = product.scoreCombination;
      }
    } else {
      // 피부 타입 정보가 없는 유저의 경우 기본 조합성 점수 사용
      skinTypeScore = product.scoreCombination;
    }

    List<Product> content = queryFactory
        .selectFrom(product)
        // INNER JOIN -> LEFT JOIN 으로 변경 (점수 없는 상품도 가져오기 위해)
        .leftJoin(recommendationScore)
        .on(product.productId.eq(recommendationScore.productId)
            .and(recommendationScore.userId.eq(userId)))
        .join(product.brand, brand).fetchJoin()
        .join(product.image, image).fetchJoin()
        .join(product.category, category).fetchJoin()
        .join(category.bigCategory, bigCategory).fetchJoin()
        .where(
            // 이제 recommendationScore.userId.eq(userId) 조건은 WHERE 절에서 빼야 합니다!
            // (ON 절로 들어갔기 때문에)
            categoryId != null ? category.categoryId.eq(categoryId) : null,
            (categoryId == null && bigCategoryId != null) ? bigCategory.bigCategoryId.eq(bigCategoryId) : null
        )
        .orderBy(
            // 1순위: 내 클릭/좋아요 점수 (null이면 0점으로 처리)
            recommendationScore.score.coalesce(BigDecimal.ZERO).desc(),
            // 2순위: 내 피부 타입에 맞는 화장품 적합도 점수
            skinTypeScore.coalesce(BigDecimal.ZERO).desc(),
            // 3순위: 동점자 처리용
            product.productId.desc()
        )
        .offset(pageable.getOffset())
        .limit(pageable.getPageSize())
        .fetch();

    // 카운트 쿼리도 수정 (마찬가지로 LEFT JOIN으로 바꾸거나 조인을 아예 뺍니다)
    JPAQuery<Long> countQuery = queryFactory
        .select(product.count())
        .from(product)
        // 필터링 조건에 따라 조인 최적화
        .join(product.category, category)
        .join(category.bigCategory, bigCategory)
        .where(
            categoryId != null ? category.categoryId.eq(categoryId) : null,
            (categoryId == null && bigCategoryId != null) ? bigCategory.bigCategoryId.eq(bigCategoryId) : null
        );

    return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
  }

//  /**
//   * only 태그만 가지고 있는지 판단한다.
//   * - 태그 외 조건이 없는 경우에만 최적화된 경로를 탄다.
//   * - 이 방식으로 시작하면 리스크가 작고, 점진적으로 범위를 확장하기가 용이하다.
//   */
//  private boolean isConcernOnlyCondition(ProductSearchCondition condition) {
//    return condition.getConcernIds() != null && !condition.getConcernIds().isEmpty()
//            && (condition.getQ() == null || condition.getQ().isBlank())
//            && condition.getCategoryId() == null
//            && condition.getBigCategoryId() == null
//            && condition.getSkinType() == null
//            && (condition.getBrandIds() == null || condition.getBrandIds().isEmpty())
//            && condition.getMinPrice() == null
//            && condition.getMaxPrice() == null;
//  }
//
//  /**
//   * tag-only 최적화 search
//   * 1) Native SQL로 product_id 페이지를 먼저 조회 (derived subquery 사용)
//   * 2) 조회된 id들만 fetch join으로 상세 조회
//   * 3) id 순서로 재정렬해서 API 정렬 안정성 유지
//   */
//  private Slice<Product> searchByConcernOnlyOptimized(ProductSearchCondition condition, Pageable pageable) {
//    List<Long> concernIds = condition.getConcernIds();
//    String derivedSql = buildConcernDerivedSql(concernIds);
//
//    String idSql = """
//            SELECT t.product_id
//            FROM ( %s ) t
//            ORDER BY t.product_id DESC
//            LIMIT :limit OFFSET :offset
//            """.formatted(derivedSql);
//
//    Query idQuery = entityManager.createNativeQuery(idSql);
//    idQuery.setParameter("limit", pageable.getPageSize() + 1);
//    idQuery.setParameter("offset", pageable.getOffset());
//
//    @SuppressWarnings("unchecked")
//    List<Number> idRows = idQuery.getResultList();
//
//    List<Long> ids = new ArrayList<>();
//    for (Number row : idRows) {
//      ids.add(row.longValue());
//    }
//
//    boolean hasNext = false;
//    if (ids.size() > pageable.getPageSize()) {
//      ids.remove(pageable.getPageSize());
//      hasNext = true;
//    }
//
//    if (ids.isEmpty()) {
//      return new SliceImpl<>(List.of(), pageable, hasNext);
//    }
//
//    List<Product> content = queryFactory
//            .selectFrom(product)
//            .join(product.brand, brand).fetchJoin()
//            .join(product.image, image).fetchJoin()
//            .join(product.category, category).fetchJoin()
//            .join(category.bigCategory, bigCategory).fetchJoin()
//            .where(product.productId.in(ids))
//            .fetch();
//
//    // IN 조회 결과는 DB가 ids 순서를 보장하지 않으므로, 원래 id 페이지 순서로 재정렬
//    Map<Long, Integer> order = new HashMap<>();
//    for (int i = 0; i < ids.size(); i++) {
//      order.put(ids.get(i), i);
//    }
//
//    content = content.stream()
//            .sorted(Comparator.comparingInt(p -> order.getOrDefault(p.getProductId(), Integer.MAX_VALUE)))
//            .toList();
//
//    return new SliceImpl<>(content, pageable, hasNext);
//  }
//
//  /**
//   * tag-only 최적화 count
//   * - 핵심: products WHERE IN(subquery) 대신, COUNT FROM (derived subquery) 형태로 고정해서 dependent subquery 위험 제거
//   */
//  private long countByConcernOnlyOptimized(ProductSearchCondition condition) {
//    String derivedSql = buildConcernDerivedSql(condition.getConcernIds());
//
//    String countSql = """
//            SELECT COUNT(*)
//            FROM ( %s ) t
//            """.formatted(derivedSql);
//
//    Number result = (Number) entityManager.createNativeQuery(countSql).getSingleResult();
//    return result != null ? result.longValue() : 0L;
//  }
//
//  /**
//   * 태그 매칭 집합(derived table) SQL 생성
//   *
//   * 주의:
//   * - 현재 concernIds는 서버 내부에서 정규화된 Long 리스트라 숫자만 들어온다는 가정 하에 문자열로 합친다.
//   * - 더 엄격하게 가려면 네이티브 파라미터 바인딩 방식으로 확장해야 한다.
//   */
//  private String buildConcernDerivedSql(List<Long> concernIds) {
//    String inClause = concernIds.stream()
//            .map(String::valueOf)
//            .collect(Collectors.joining(","));
//
//    return """
//            SELECT pcc.product_id
//            FROM product_concern_cache pcc
//            WHERE pcc.skin_concern_id IN (%s)
//            GROUP BY pcc.product_id
//            HAVING COUNT(DISTINCT pcc.skin_concern_id) = %d
//            """.formatted(inClause, concernIds.size());
//  }

  private boolean hasConcerns(ProductSearchCondition condition) {
    return condition.getConcernIds() != null && !condition.getConcernIds().isEmpty();
  }

  private Slice<Product> searchByConcernOptimized(ProductSearchCondition condition, Pageable pageable) {
    NativeSql idSql = buildConcernOptimizedIdSql(condition, pageable);

    Query idQuery = entityManager.createNativeQuery(idSql.sql());
    bindParams(idQuery, idSql.params());

    @SuppressWarnings("unchecked")
    List<Number> idRows = idQuery.getResultList();

    List<Long> ids = new ArrayList<>();
    for (Number row : idRows) {
      ids.add(row.longValue());
    }

    boolean hasNext = false;
    if (ids.size() > pageable.getPageSize()) {
      ids.remove(pageable.getPageSize());
      hasNext = true;
    }

    if (ids.isEmpty()) {
      return new SliceImpl<>(List.of(), pageable, hasNext);
    }

    List<Product> content = queryFactory
            .selectFrom(product)
            .join(product.brand, brand).fetchJoin()
            .join(product.image, image).fetchJoin()
            .join(product.category, category).fetchJoin()
            .join(category.bigCategory, bigCategory).fetchJoin()
            .where(product.productId.in(ids))
            .fetch();

    Map<Long, Integer> order = new HashMap<>();
    for (int i = 0; i < ids.size(); i++) {
      order.put(ids.get(i), i);
    }

    content = content.stream()
            .sorted(Comparator.comparingInt(p -> order.getOrDefault(p.getProductId(), Integer.MAX_VALUE)))
            .toList();

    return new SliceImpl<>(content, pageable, hasNext);
  }

  private long countByConcernOptimized(ProductSearchCondition condition) {
    NativeSql countSql = buildConcernOptimizedCountSql(condition);

    Query query = entityManager.createNativeQuery(countSql.sql());
    bindParams(query, countSql.params());

    Number result = (Number) query.getSingleResult();
    return result != null ? result.longValue() : 0L;
  }

  private NativeSql buildConcernOptimizedIdSql(ProductSearchCondition condition, Pageable pageable) {
    StringBuilder sql = new StringBuilder();
    Map<String, Object> params = new HashMap<>();

    sql.append("SELECT p.product_id ");
    sql.append(buildFromWithConcernDerived(condition, params));
    sql.append(buildWhereClause(condition, params));
    sql.append(" ORDER BY p.product_id DESC ");
    sql.append(" LIMIT :limit OFFSET :offset ");

    params.put("limit", pageable.getPageSize() + 1);
    params.put("offset", pageable.getOffset());

    return new NativeSql(sql.toString(), params);
  }

  private NativeSql buildConcernOptimizedCountSql(ProductSearchCondition condition) {
    StringBuilder sql = new StringBuilder();
    Map<String, Object> params = new HashMap<>();

    sql.append("SELECT COUNT(*) ");
    sql.append(buildFromWithConcernDerived(condition, params));
    sql.append(buildWhereClause(condition, params));

    return new NativeSql(sql.toString(), params);
  }

  private String buildFromWithConcernDerived(ProductSearchCondition condition, Map<String, Object> params) {
    StringBuilder from = new StringBuilder();

    from.append("FROM products p ");
    from.append("JOIN (");
    from.append(buildConcernDerivedSql(condition.getConcernIds(), params));
    from.append(") t ON t.product_id = p.product_id ");

    if (needsBrandJoinForNative(condition)) {
      from.append("JOIN brand b ON b.brand_id = p.brand_id ");
    }
    if (needsCategoryJoinForNative(condition)) {
      from.append("JOIN category c ON c.category_id = p.category_id ");
    }

    return from.toString();
  }

  private String buildWhereClause(ProductSearchCondition condition, Map<String, Object> params) {
    List<String> clauses = new ArrayList<>();

    if (condition.getCategoryId() != null) {
      clauses.add("p.category_id = :categoryId");
      params.put("categoryId", condition.getCategoryId());
    }

    if (condition.getCategoryId() == null && condition.getBigCategoryId() != null) {
      clauses.add("c.big_category_id = :bigCategoryId");
      params.put("bigCategoryId", condition.getBigCategoryId());
    }

    if (condition.getBrandIds() != null && !condition.getBrandIds().isEmpty()) {
      clauses.add(buildInClause("p.brand_id", "brand", condition.getBrandIds(), params));
    }

    if (condition.getMinPrice() != null) {
      clauses.add("p.price >= :minPrice");
      params.put("minPrice", condition.getMinPrice());
    }

    if (condition.getMaxPrice() != null) {
      clauses.add("p.price <= :maxPrice");
      params.put("maxPrice", condition.getMaxPrice());
    }

    if (condition.getSkinType() != null) {
      clauses.add("(p.top_skin_type = :skinType OR p.top2_skin_type = :skinType)");
      params.put("skinType", condition.getSkinType().name());
    }

    if (condition.getQ() != null && !condition.getQ().isBlank()) {
      clauses.add("(LOWER(p.name) LIKE :q OR LOWER(b.brand_name) LIKE :q)");
      params.put("q", "%" + condition.getQ().toLowerCase() + "%");
    }

    if (clauses.isEmpty()) {
      return "";
    }
    return " WHERE " + String.join(" AND ", clauses);
  }

  private String buildConcernDerivedSql(List<Long> concernIds, Map<String, Object> params) {
    String inClause = buildInClause("pcc.skin_concern_id", "concern", concernIds, params);

    return """
        SELECT pcc.product_id
        FROM product_concern_cache pcc
        WHERE %s
        GROUP BY pcc.product_id
        HAVING COUNT(DISTINCT pcc.skin_concern_id) = :concernCount
        """.formatted(inClause);
  }

  private String buildInClause(String column, String prefix, List<Long> values, Map<String, Object> params) {
    List<String> placeholders = new ArrayList<>();
    for (int i = 0; i < values.size(); i++) {
      String name = prefix + i;
      placeholders.add(":" + name);
      params.put(name, values.get(i));
    }
    if ("concern".equals(prefix)) {
      params.put("concernCount", values.size());
    }
    return column + " IN (" + String.join(",", placeholders) + ")";
  }

  private void bindParams(Query query, Map<String, Object> params) {
    for (Map.Entry<String, Object> entry : params.entrySet()) {
      query.setParameter(entry.getKey(), entry.getValue());
    }
  }

  private boolean needsBrandJoinForNative(ProductSearchCondition condition) {
    return condition.getQ() != null && !condition.getQ().isBlank();
  }

  private boolean needsCategoryJoinForNative(ProductSearchCondition condition) {
    return condition.getCategoryId() == null && condition.getBigCategoryId() != null;
  }

  private record NativeSql(String sql, Map<String, Object> params) {
  }

  // search 전용 where
  private BooleanBuilder buildSearchWhere(ProductSearchCondition condition) {
    return new BooleanBuilder()
            .and(qContains(condition.getQ()))
            .and(categoryEq(condition.getCategoryId()))
            .and(bigCategoryEqWhenCategoryNull(condition.getCategoryId(), condition.getBigCategoryId()))
            .and(skinTypeEq(condition.getSkinType()))
            .and(hasAllConcerns(condition.getConcernIds()))
            .and(brandIn(condition.getBrandIds()))
            .and(minPriceGoe(condition.getMinPrice()))
            .and(maxPriceLoe(condition.getMaxPrice()));
  }

  // count 전용 where
  private BooleanBuilder buildCountWhere(ProductSearchCondition condition) {
    return new BooleanBuilder()
            .and(qContains(condition.getQ()))
            .and(categoryEq(condition.getCategoryId()))
            .and(bigCategoryEqWhenCategoryNull(condition.getCategoryId(), condition.getBigCategoryId()))
            .and(skinTypeEq(condition.getSkinType()))
            .and(hasAllConcerns(condition.getConcernIds()))
            .and(brandIn(condition.getBrandIds()))
            .and(minPriceGoe(condition.getMinPrice()))
            .and(maxPriceLoe(condition.getMaxPrice()));
  }

  // count join 필요 여부 판별
  private boolean needsBrandJoin(ProductSearchCondition condition) {
    return (condition.getBrandIds() != null && !condition.getBrandIds().isEmpty())
            || (condition.getQ() != null && !condition.getQ().isBlank());
  }

  private boolean needsCategoryJoin(ProductSearchCondition condition) {
    return condition.getCategoryId() != null || condition.getBigCategoryId() != null;
  }

  private boolean needsBigCategoryJoin(ProductSearchCondition condition) {
    return condition.getCategoryId() == null && condition.getBigCategoryId() != null;
  }

  private BooleanExpression qContains(String q) {
    if (q == null || q.isBlank()) {
      return null;
    }
    return product.name.containsIgnoreCase(q)
            .or(brand.brandName.containsIgnoreCase(q));
  }

  private BooleanExpression categoryEq(Long categoryId) {
    if (categoryId == null) {
      return null;
    }
    return category.categoryId.eq(categoryId);
  }
  private BooleanExpression bigCategoryEqWhenCategoryNull(Long categoryId, Integer bigCategoryId) {
    if (categoryId != null || bigCategoryId == null) {
      return null;
    }
    return bigCategory.bigCategoryId.eq(bigCategoryId);
  }

  private BooleanExpression skinTypeEq(SkinTypeEnum skinType) {
    if (skinType == null) {
      return null;
    }
    return product.topSkinType.eq(skinType)
            .or(product.top2SkinType.eq(skinType));
  }

  /**
   * 기존 태그 조건(기본 경로에서만 사용)
   * - 현재 시간이 오래걸리는 이슈는 이 형태가 dependent subquery로 바뀌는 경우에 발생 가능
   */
  // 서브쿼리 방식 -> 비상관 서브쿼리 (IN + GROUP BY + HAVING)
  private BooleanExpression hasAllConcerns(List<Long> concernIds) {
    if (concernIds == null || concernIds.isEmpty()) {
      return null;
    }
    long concernCount = concernIds.size();

    return product.productId.in(
            JPAExpressions
                    .select(productConcernCache.productId)
                    .from(productConcernCache)
                    .where(productConcernCache.skinConcernId.in(concernIds))
                    .groupBy(productConcernCache.productId)
                    .having(productConcernCache.skinConcernId.countDistinct().eq(concernCount))
    );
  }

  private BooleanExpression brandIn(List<Long> brandIds) {
    if (brandIds == null || brandIds.isEmpty()) {
      return null;
    }
    return brand.brandId.in(brandIds);
  }

  private BooleanExpression minPriceGoe(Integer minPrice) {
    if (minPrice == null) {
      return null;
    }
    return product.price.goe(minPrice);
  }

  private BooleanExpression maxPriceLoe(Integer maxPrice) {
    if (maxPrice == null) {
      return null;
    }
    return product.price.loe(maxPrice);
  }
}

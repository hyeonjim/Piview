package com.piview.backend.domain.product.catalog.repository;

import java.util.List;

import com.piview.backend.domain.product.catalog.dto.ProductSearchCondition;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.skin.common.SkinTypeEnum;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.stereotype.Repository;

import static com.piview.backend.domain.product.entity.QBigCategory.bigCategory;
import static com.piview.backend.domain.product.entity.QBrand.brand;
import static com.piview.backend.domain.product.entity.QCategory.category;
import static com.piview.backend.domain.product.entity.QImage.image;
import static com.piview.backend.domain.product.entity.QProduct.product;
import static com.piview.backend.domain.product.entity.QProductConcernCache.productConcernCache;

@Repository
@RequiredArgsConstructor
public class ProductRepositoryImpl implements ProductRepositoryCustom {

  private final JPAQueryFactory queryFactory;

  @Override
  public Slice<Product> search(ProductSearchCondition condition, Pageable pageable) {

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

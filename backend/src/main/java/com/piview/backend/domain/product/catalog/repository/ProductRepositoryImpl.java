package com.piview.backend.domain.product.catalog.repository;

import java.util.List;

import com.piview.backend.domain.product.catalog.dto.ProductSearchCondition;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.skin.common.SkinTypeEnum;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.JPAExpressions;
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
import static com.piview.backend.domain.product.entity.QProductTagScore.productTagScore;

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
            .where(
                    qContains(condition.getQ()),
                    categoryEq(condition.getCategoryId()),
                    bigCategoryEqWhenCategoryNull(condition.getCategoryId(), condition.getBigCategoryId()),
                    skinTypeEq(condition.getSkinType()),
                    hasAllTags(condition.getTagIds()),
                    brandIn(condition.getBrandIds()),
                    minPriceGoe(condition.getMinPrice()),
                    maxPriceLoe(condition.getMaxPrice())
            )
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

  private BooleanExpression hasAllTags(List<Long> tagIds) {
    if (tagIds == null || tagIds.isEmpty()) {
      return null;
    }
    long tagCount = tagIds.size();

    return JPAExpressions
            .select(productTagScore.tag.tagId.countDistinct())
            .from(productTagScore)
            .where(
                    productTagScore.product.eq(product),
                    productTagScore.isTagged.isTrue(),
                    productTagScore.tag.tagId.in(tagIds)
            )
            .eq(tagCount);
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

  public long count(ProductSearchCondition condition) {
    Long result = queryFactory
            .select(product.count())
            .from(product)
            .join(product.brand, brand)
            .join(product.category, category)
            .join(category.bigCategory, bigCategory)
            .where(
                    qContains(condition.getQ()),
                    categoryEq(condition.getCategoryId()),
                    bigCategoryEqWhenCategoryNull(condition.getCategoryId(), condition.getBigCategoryId()),
                    skinTypeEq(condition.getSkinType()),
                    hasAllTags(condition.getTagIds()),
                    brandIn(condition.getBrandIds()),
                    minPriceGoe(condition.getMinPrice()),
                    maxPriceLoe(condition.getMaxPrice())
            )
            .fetchOne();

    return result != null ? result : 0L;
  }
}

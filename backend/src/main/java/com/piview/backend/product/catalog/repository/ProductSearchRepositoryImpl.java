package com.piview.backend.product.catalog.repository;

import com.piview.backend.product.entity.Product;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.core.types.dsl.StringTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.piview.backend.product.entity.QBrand.brand;
import static com.piview.backend.product.entity.QCategory.category;
import static com.piview.backend.product.entity.QImage.image;
import static com.piview.backend.product.entity.QProduct.product;
import static com.piview.backend.product.entity.QProductSkinScore.productSkinScore;

@Repository
@RequiredArgsConstructor
public class ProductSearchRepositoryImpl implements ProductSearchRepositoryCustom {

  private final JPAQueryFactory queryFactory;

  @Override
  public Slice<Product> searchProductsByKeywords(String rawKeyword, Pageable pageable) {
    // 검색어를 공백 기준으로 분리 ("라운드랩 토너" -> ["라운드랩", "토너"])
    String[] tokens = rawKeyword.trim().split("\\s+");

    // 동적 쿼리를 만들기 위한 조립기
    BooleanBuilder builder = new BooleanBuilder();

    for (String token : tokens) {
      if (token.isEmpty()) continue;

      // DB 컬럼의 공백을 제거하는 SQL 함수 적용 (레벨 1 + 레벨 2 결합)
      StringTemplate productNameNoSpace = Expressions.stringTemplate("REPLACE({0}, ' ', '')", product.name);
      StringTemplate brandNameNoSpace = Expressions.stringTemplate("REPLACE({0}, ' ', '')", brand.brandName);

      // "상품명에 토큰이 포함되거나 OR 브랜드명에 토큰이 포함되어야 한다"를 AND로 계속 엮음
      builder.and(
          productNameNoSpace.containsIgnoreCase(token)
              .or(brandNameNoSpace.containsIgnoreCase(token))
      );
    }

    // QueryDSL 쿼리 실행
    List<Product> content = queryFactory
        .selectFrom(product)
        .join(product.brand, brand).fetchJoin()
        .leftJoin(product.image, image).fetchJoin()
        .leftJoin(product.category, category).fetchJoin()
        .leftJoin(product.skinScore, productSkinScore).fetchJoin()
        .where(builder)
        .offset(pageable.getOffset())
        .limit(pageable.getPageSize() + 1) // Slice 처리를 위해 요청한 사이즈보다 1개 더 가져옴
        .fetch();

    // 무한 스크롤(Slice) hasNext 계산 로직
    boolean hasNext = false;
    if (content.size() > pageable.getPageSize()) {
      content.remove(pageable.getPageSize()); // 진짜 리턴할 개수만 남기고 추가로 가져온 1개는 버림
      hasNext = true;
    }

    return new SliceImpl<>(content, pageable, hasNext);
  }
}
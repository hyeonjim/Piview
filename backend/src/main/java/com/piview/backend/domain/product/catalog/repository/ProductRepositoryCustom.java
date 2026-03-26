package com.piview.backend.domain.product.catalog.repository;

import com.piview.backend.domain.product.catalog.dto.ProductSearchCondition;
import com.piview.backend.domain.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import java.util.List;

public interface ProductRepositoryCustom {
  Slice<Product> search(ProductSearchCondition condition, Pageable pageable);

  long count(ProductSearchCondition condition); // total page 받기

  Page<Product> findRecommendedProducts(Long userId, String userSkinType, Integer bigCategoryId, Long categoryId, Pageable pageable);

  Slice<Product> searchByRankedProductIds(
    ProductSearchCondition condition,
    List<Long> rankedProductIds,
    Pageable pageable
  );

  long countByRankedProductIds(
    ProductSearchCondition condition,
    List<Long> rankedProductIds
  );
}

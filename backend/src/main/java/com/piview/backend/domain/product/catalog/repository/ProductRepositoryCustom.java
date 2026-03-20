package com.piview.backend.domain.product.catalog.repository;

import com.piview.backend.domain.product.catalog.dto.ProductSearchCondition;
import com.piview.backend.domain.product.entity.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface ProductRepositoryCustom {
  Slice<Product> search(ProductSearchCondition condition, Pageable pageable);
}

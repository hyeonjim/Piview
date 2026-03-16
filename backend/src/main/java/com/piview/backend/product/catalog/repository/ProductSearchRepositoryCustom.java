package com.piview.backend.product.catalog.repository;

import com.piview.backend.product.catalog.dto.ProductSearchCondition;
import com.piview.backend.product.entity.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface ProductSearchRepositoryCustom {
  Slice<Product> search(ProductSearchCondition condition, Pageable pageable);
}

package com.piview.backend.product.catalog.repository;

import com.piview.backend.product.entity.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface ProductSearchRepositoryCustom {
  Slice<Product> searchProductsByKeywords(String keyword, Pageable pageable);
}

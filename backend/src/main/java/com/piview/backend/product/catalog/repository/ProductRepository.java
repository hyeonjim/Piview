package com.piview.backend.product.catalog.repository;

import com.piview.backend.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


public interface ProductRepository extends JpaRepository<Product, Long>, ProductRepositoryCustom {
  Optional<Product> findByProductId(Long productId);

  // productId 리스트로 여러 개 한번에 조회
  List<Product> findByProductIdIn(List<Long> productIds);

}

package com.piview.backend.product.catalog.repository;

import com.piview.backend.product.entity.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductSearchRepository extends JpaRepository<Product, Long>{
  // N+1 문제 방지를 위해 DTO 변환에 필요한 Brand와 Image를 Fetch Join으로 한 번에 조회
  @Query("SELECT p FROM Product p " +
      "JOIN FETCH p.brand b " +
      "LEFT JOIN FETCH p.image i " +
      "LEFT JOIN FETCH p.category c " +
      "LEFT JOIN FETCH p.skinScore s " +
      "WHERE p.name LIKE %:keyword% " +
      "OR b.brandName LIKE %:keyword%")
  Slice<Product> searchByBrandOrProductName(@Param("keyword") String keyword, Pageable pageable);
}

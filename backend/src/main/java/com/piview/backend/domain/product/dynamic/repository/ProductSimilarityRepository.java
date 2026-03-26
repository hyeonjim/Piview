package com.piview.backend.domain.product.dynamic.repository;

import com.piview.backend.domain.product.dynamic.entity.ProductSimilarity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductSimilarityRepository extends JpaRepository<ProductSimilarity, Long> {
    // 기준 상품 ID들을 주면, 함께 많이 본 연관 상품 ID들을 점수순으로 가져오기 (최대 20개)
    @Query(value = "SELECT related_product_id FROM product_similarity WHERE product_id IN :productIds ORDER BY similarity_score DESC LIMIT 100", nativeQuery = true)
    List<Long> findSimilarProductIds(@Param("productIds") List<Long> productIds);
}

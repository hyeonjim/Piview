package com.piview.backend.domain.product.catalog.repository;

import com.piview.backend.domain.product.entity.ProductConcernCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductConcernCacheRepository extends JpaRepository<ProductConcernCache, Long> {

    interface ConcernView {
        Long getProductId();
        Long getConcernId();
        String getConcernName();
        Long getScore();
    }

    @Query("""
        SELECT
            pcc.productId AS productId,
            sc.id AS concernId,
            sc.concernName AS concernName,
            pcc.totalConcernScore AS score
        FROM ProductConcernCache pcc, SkinConcerns sc
        WHERE pcc.skinConcernId = sc.id
        AND pcc.productId IN :productIds
        ORDER BY pcc.productId ASC, pcc.totalConcernScore DESC, sc.id ASC 
    """)
    List<ConcernView> findConcernViewsByProductIds(@Param("productIds") List<Long> productIds);
}

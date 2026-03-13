package com.piview.backend.product.repository;

import com.piview.backend.product.entity.ProductTagScore;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class ProductTagScoreRepository {

    private final EntityManager em;

    /**
     * is_tagged = true인 경우 반환
     */
    public List<ProductTagScore> findTaggedByProductId(Long productId) {

        return em.createQuery(
                "SELECT pts FROM ProductTagScore pts " +
                        "JOIN FETCH pts.tag " +
                        "WHERE pts.product.productId = :productId " +
                        "AND pts.isTagged = true",
                ProductTagScore.class)
                .setParameter("productId", productId)
                .getResultList();
    }
}

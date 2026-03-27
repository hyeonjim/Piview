package com.piview.backend.domain.product.catalog.repository;

import com.piview.backend.domain.product.entity.ProductIngredients;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ProductIngredientRepository {

    private final EntityManager em;


    public Optional<ProductIngredients> findByProductId(Long productId) {
        List<ProductIngredients> result = em.createQuery(
                        "SELECT pi FROM ProductIngredients pi WHERE pi.product.productId = :productId",
                        ProductIngredients.class)
                .setParameter("productId", productId)
                .setMaxResults(1)
                .getResultList();

        return result.stream().findFirst();
    }

    // compare API에서 상품 2개의 원문 성분을 한 번에 가져오기 위한 조회
    public List<ProductIngredients> findByProductIds(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return List.of();
        }

        return em.createQuery(
                "SELECT pi FROM ProductIngredients pi WHERE pi.product.productId IN :productIds",
                ProductIngredients.class)
                .setParameter("productIds", productIds)
                .getResultList();
    }
}

package com.piview.backend.product.catalog.repository;

import com.piview.backend.product.entity.ProductIngredients;
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
}

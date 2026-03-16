package com.piview.backend.product.catalog.repository;

import com.piview.backend.product.entity.ProductIngredient;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class ProductIngredientRepository {

    private final EntityManager em;

    /**
     * 특정 제품의 성분 목록 (position 오름차순 = 함량 높은 성분부터)
     *
     * LEFT JOIN FETCH pi.ingredient:
     *      ingredient_id가 null인 성분도 함께 조회
     *      INNER JOIN이면 매칭 실패 성분은 아예 목록에서 빠짐
     *
     */
    @SuppressWarnings("checkstyle:OperatorWrap")
    public List<ProductIngredient> findByProductId(Long productId) {

        return em.createQuery(
                "SELECT pi FROM ProductIngredient pi " +
                        "LEFT JOIN FETCH pi.ingredient " +
                        "WHERE pi.product.productId = :productId " +
                        "ORDER BY pi.position ASC",
                ProductIngredient.class)
                .setParameter("productId", productId)
                .getResultList();
    }
}

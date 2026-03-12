package com.piview.backend.product.repository;

import com.piview.backend.product.entity.Product;
import com.piview.backend.product.entity.SkinTypeEnum;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ProductRepository {

    private final EntityManager em;

    /**
     * 동적 검색 쿼리
     *
     * 카테고리 필터:
     *      UI 흐름 상 categoryId는 bigCategoryId와 함께 전달된다.(카테고리 단독은 존재하지 않는다.)
     *      bigCategoryId만 존재하면 해당 대카테고리 전체 조회
     *
     * skinType 필터:
     *      topSkinType OR top2SkinType 중 하나라도 일치하면 반환
     *      LEFT JOIN: skinscore가 없는 제품도 반환하기 위해서
     *
     * tagIds 필터(AND):
     *      선택한 태그를 모두 포함하는 상품만 반환
     *      COUNT 서브 쿼리 구현: 조건 충족 태그 수 = tagIds.size()
     *
     * TypedQuery<Product>: 반환 타입 Product 고정
     * setParameter(): 이름 바인딩으로 SQL Injection 방지
     * sexMaxResults(50): 추후 페이지 확장(무한 스크롤 방지)
     */

    public List<Product> findByContidions(
            String name, String brand,
            Long categoryId, Integer bigCategoryId,
            String skinType, List<Integer> tagIds) {

        StringBuilder jpql = new StringBuilder(
                "SELECT DISTINCT p FROM Product p " +
                        "JOIN FETCH p.brand b " +
                        "JOIN FETCH p.image i " +
                        "JOIN FETCH p.category c " +
                        "JOIN FETCH c.bigCategory bc " +
                        "LEFT JOIN FETCH p.skinScore ss "
        );

        List<String> conditions = new ArrayList<>();
        if (name != null && !name.isBlank()) {
            conditions.add("p.name LIKE :name");
        }

        if (brand != null && !brand.isBlank()) {
            conditions.add("b.brandName LIKE :brand");
        }

        if (categoryId != null) {
            conditions.add("c.categoryId = :categoryId");
        } else if (bigCategoryId != null) {
            conditions.add("bc.bigCategoryId = :bigCategoryId");
        }

        if (skinType != null && !skinType.isBlank()) {
            conditions.add("(ss.topSkinType = :skinType or ss.top2SkinType = :skinType)");
        }

        if (tagIds != null && !tagIds.isEmpty()) {
            conditions.add("(SELECT COUNT(DISTINCT pts.tag.tagId) FROM ProductTagScore pts " +
                    " WHERE pts.product = p AND pts.tag.tagId IN :tagIds AND pts.isTagged = true) = :tagCount");
        }

        if (!conditions.isEmpty()) {
            jpql.append("WHERE ").append(String.join(" And ", conditions)).append(" ");
        }

        jpql.append("ORDER BY p.productId DESC");

        TypedQuery<Product> query = em.createQuery(jpql.toString(), Product.class);


        // 조건이 있을 때만 parameter binding
        if (name != null && !name.isBlank()) {
            query.setParameter("name", "%" + name + "%");
        }

        if (brand != null && !brand.isBlank()) {
            query.setParameter("brand", "%" + brand + "%");
        }

        if (categoryId != null) {
            query.setParameter("categoryId", categoryId);
        } else if (bigCategoryId != null) {
            query.setParameter("bigCategoryId", bigCategoryId);
        }

        if (skinType != null && !skinType.isBlank()) {
            query.setParameter("skinType", SkinTypeEnum.valueOf(skinType));
        }

        if (tagIds != null && !tagIds.isEmpty()) {
            query.setParameter("tagIds", tagIds);
            query.setParameter("tagCount", (long) tagIds.size());
        }

        query.setMaxResults(50);
        return query.getResultList();
    }

    /**
     * 제품 상세 조회
     * 상세 페이지에 필요한 모든 연관 데이터를 한 번의 쿼리로 FETCH
     *
     * LEFT JOIN FETCH p.skinScore:
     *      ProductSkinScores에 데이터가 없는 제품도 조회 가능하게!
     *      (INNER JOIN이면 SkinScore가 없는 제품은 결과에서 제외됨)
     *
     * NoResultException: getStringResult()는 결과가 없으면 예외를 던짐
     *      -> try-catch로 Optional.empty() 반환
     */
    public Optional<Product> findDetailById(Long productId) {
        try {
            Product result = em.createQuery(
                    "SELECT p FROM Product p " +
                            "JOIN FETCH p.brand " +
                            "JOIN FETCH p.category c " +
                            "JOIN FETCH c.bigCategory " +
                            "JOIN FETCH p.image " +
                            "LEFT JOIN FETCH p.skinScore " +
                            "WHERE p.productId = :productId",
                    Product.class)
                    .setParameter("productId", productId)
                    .getSingleResult();
            return Optional.of(result);
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }
}

package com.piview.backend.product.repository;

import com.piview.backend.product.entity.Product;
import com.piview.backend.product.entity.SkinTypeEnum;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class ProductRepository {

    private final EntityManager em;

    /**
     * 동적 검색 쿼리 (페이지네이션 포함)
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
     * 페이지네이션:
     *      setFirstResult(page * size): offset
     *      setMaxResults(size + 1): size+1개 조회 → hasNext 판단 (COUNT 쿼리 불필요)
     */
    public List<Product> findByConditions(
            String name, String brand,
            Long categoryId, Integer bigCategoryId,
            String skinType, List<Long> tagIds,
            int page, int size) {

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

        // 페이지네이션: size+1개 조회로 hasNext 판단 (COUNT 쿼리 불필요)
        query.setFirstResult(page * size);
        query.setMaxResults(size + 1);

        return query.getResultList();
    }
}
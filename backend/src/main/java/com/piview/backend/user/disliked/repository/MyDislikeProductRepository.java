package com.piview.backend.user.disliked.repository;

import com.piview.backend.user.disliked.entity.MyDislikeProduct;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MyDislikeProductRepository extends JpaRepository<MyDislikeProduct, Long> {

    // dislike 쪽은 Product 엔티티 PK(id)와 실DB(products.product_id) 불일치를 피하려고 native query로 통일했다.
    // 같은 사용자가 같은 product_id를 이미 등록했는지 확인하는 중복 체크 쿼리다.
    @Query(
        value = "SELECT COUNT(*) "
            + "FROM my_dislike_product "
            + "WHERE user_id = :userId AND product_id = :productId",
        nativeQuery = true
    )
    long countDislikedProductByUserIdAndProductId(
        @Param("userId") Long userId,
        @Param("productId") Long productId
    );

    // 요청으로 받은 productId가 products.product_id에 실제로 존재하는지 확인하는 쿼리다.
    @Query(
        value = "SELECT COUNT(*) "
            + "FROM products "
            + "WHERE product_id = :productId",
        nativeQuery = true
    )
    long countProductByProductId(@Param("productId") Long productId);

    // 목록 응답에 필요한 표시값만 직접 조인해서 읽어 JPA Product 매핑 영향을 받지 않게 한다.
    @Query(
        value = "SELECT mdp.dislike_product_id AS dislikedProductId, "
            + "p.product_id AS productId, "
            + "p.name AS productName, "
            + "b.brand_name AS brandName, "
            + "c.category_name AS categoryName, "
            + "i.url AS imageUrl, "
            + "p.volume AS volume, "
            + "p.price AS price, "
            + "p.top_skin_type AS topSkinType, "
            + "p.top2_skin_type AS top2SkinType "
            + "FROM my_dislike_product mdp "
            + "JOIN products p ON p.product_id = mdp.product_id "
            + "LEFT JOIN brand b ON b.brand_id = p.brand_id "
            + "LEFT JOIN category c ON c.category_id = p.category_id "
            + "LEFT JOIN images i ON i.image_id = p.image_id "
            + "WHERE mdp.user_id = :userId "
            + "ORDER BY mdp.dislike_product_id DESC",
        nativeQuery = true
    )
    List<DislikedProductSummaryRow> findDislikedProductSummariesByUserId(@Param("userId") Long userId);

    // dislike_product_id는 별도 AUTO_INCREMENT PK라 생성 후 한 번 더 조회해서 응답한다.
    @Modifying
    @Query(
        value = "INSERT INTO my_dislike_product (created_at, updated_at, user_id, product_id) "
            + "VALUES (CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), :userId, :productId)",
        nativeQuery = true
    )
    int insertDislikedProduct(
        @Param("userId") Long userId,
        @Param("productId") Long productId
    );

    // 방금 등록한 user_id + product_id 조합으로 생성된 dislike_product_id를 다시 읽어오는 쿼리다.
    @Query(
        value = "SELECT dislike_product_id "
            + "FROM my_dislike_product "
            + "WHERE user_id = :userId AND product_id = :productId "
            + "LIMIT 1",
        nativeQuery = true
    )
    Optional<Long> findDislikedProductIdByUserIdAndProductId(
        @Param("userId") Long userId,
        @Param("productId") Long productId
    );

    // 삭제 API에서 소유권(user_id)까지 같이 확인하며 한 건만 지우는 쿼리다.
    @Modifying
    @Query(
        value = "DELETE FROM my_dislike_product "
            + "WHERE dislike_product_id = :dislikedProductId AND user_id = :userId",
        nativeQuery = true
    )
    int deleteByIdAndUserIdNative(
        @Param("dislikedProductId") Long dislikedProductId,
        @Param("userId") Long userId
    );

    // 문제 성분 재계산을 위해 현재 사용자가 등록한 모든 product_id만 뽑아오는 쿼리다.
    @Query(
        value = "SELECT product_id "
            + "FROM my_dislike_product "
            + "WHERE user_id = :userId",
        nativeQuery = true
    )
    List<Long> findProductIdsByUserId(@Param("userId") Long userId);

    // 문제 성분 재계산은 최신 전성분 문자열 한 줄만 있으면 되므로 가장 최근 row 하나만 읽는다.
    @Query(
        value = "SELECT product_ingredients_ko AS productIngredientsKo, "
            + "product_ingredients_en AS productIngredientsEn "
            + "FROM product_ingredients "
            + "WHERE product_id = :productId "
            + "ORDER BY id DESC "
            + "LIMIT 1",
        nativeQuery = true
    )
    Optional<ProductIngredientTextRow> findIngredientTextsByProductId(@Param("productId") Long productId);

    interface DislikedProductSummaryRow {
        Long getDislikedProductId();
        Long getProductId();
        String getProductName();
        String getBrandName();
        String getCategoryName();
        String getImageUrl();
        String getVolume();
        Integer getPrice();
        String getTopSkinType();
        String getTop2SkinType();
    }

    // product_ingredients 테이블의 최신 전성분 문자열 두 컬럼만 받는 projection이다.
    interface ProductIngredientTextRow {
        String getProductIngredientsKo();
        String getProductIngredientsEn();
    }
}

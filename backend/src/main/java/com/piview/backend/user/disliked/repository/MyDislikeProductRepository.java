package com.piview.backend.user.disliked.repository;

import com.piview.backend.user.disliked.entity.MyDislikeProduct;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MyDislikeProductRepository extends JpaRepository<MyDislikeProduct, Long> {

    // 같은 사용자가 같은 상품을 중복 등록했는지 확인한다.
    boolean existsByUser_IdAndProduct_ProductId(Long userId, Long productId);

    // 삭제 시 등록 ID와 사용자 ID를 함께 확인해 본인 데이터만 찾는다.
    java.util.Optional<MyDislikeProduct> findByIdAndUser_Id(Long dislikedProductId, Long userId);

    // 목록 조회 시 상품, 브랜드, 이미지까지 함께 가져와 N+1을 피한다.
    @Query("SELECT mdp FROM MyDislikeProduct mdp "
        + "JOIN FETCH mdp.product p "
        + "LEFT JOIN FETCH p.brand "
        + "LEFT JOIN FETCH p.category "
        + "LEFT JOIN FETCH p.image "
        + "WHERE mdp.user.id = :userId "
        + "ORDER BY mdp.id DESC")
    List<MyDislikeProduct> findAllByUserIdWithProduct(@Param("userId") Long userId);
}

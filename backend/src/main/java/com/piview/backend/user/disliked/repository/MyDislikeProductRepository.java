package com.piview.backend.user.disliked.repository;

import com.piview.backend.user.disliked.entity.MyDislikeProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MyDislikeProductRepository extends JpaRepository<MyDislikeProduct, Long> {

    // 같은 사용자가 같은 상품을 중복 등록했는지 확인한다.
    boolean existsByUser_IdAndProduct_ProductId(Long userId, Long productId);
}

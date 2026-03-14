package com.piview.backend.routine.item.repository;

import com.piview.backend.routine.item.entity.MyCos;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MyCosRepository extends JpaRepository<MyCos, Long> {

    // Fetch Join: MyCos -> Product -> Brand & Image까지 한 번에 쿼리 1번으로 가져오기
    @Query("SELECT m FROM MyCos m " +
            "JOIN FETCH m.product p " +
            "JOIN FETCH p.brand " +
            "JOIN FETCH p.category " +
            "JOIN FETCH p.image " +
            "WHERE m.user.id = :userId")
    List<MyCos> findAllByUserIdWithProduct(@Param("userId") Long userId);

    // 유저 ID와 상품 ID로 이미 저장된 데이터가 있는지 확인 (중복 방지용)
    @Query("SELECT COUNT(m) > 0 FROM MyCos m WHERE m.user.id = :userId AND m.product.productId = :productId")
    boolean existsByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);
}
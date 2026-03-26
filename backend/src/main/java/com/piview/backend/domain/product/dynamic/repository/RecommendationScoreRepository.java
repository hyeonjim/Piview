package com.piview.backend.domain.product.dynamic.repository;

import com.piview.backend.domain.product.dynamic.entity.RecommendationScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecommendationScoreRepository extends JpaRepository<RecommendationScore, Long> {
    // 이 유저의 관심도 점수가 가장 높은 상품 ID 3개만 빠르게 가져오기
    @Query(value = "SELECT product_id FROM recommendation_score WHERE user_id = :userId ORDER BY score DESC LIMIT 3", nativeQuery = true)
    List<Long> findTopProductIdsByUserId(@Param("userId") Long userId);
}

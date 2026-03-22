package com.piview.backend.domain.product.catalog.repository;

import com.piview.backend.domain.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;


public interface ProductRepository extends JpaRepository<Product, Long>, ProductRepositoryCustom {
  Optional<Product> findByProductId(Long productId);

  // productId 리스트로 여러 개 한번에 조회
  List<Product> findByProductIdIn(List<Long> productIds);

    // =================================================================================
    // [분기 A] 장바구니가 비어있을 때 (초기 추천)
    // =================================================================================
    @Query(nativeQuery = true, value = """
        SELECT DISTINCT p.*
        FROM Products p
        JOIN Category c ON p.category_id = c.category_id
        LEFT JOIN ProductConcernCache pcc ON p.product_id = pcc.product_id AND pcc.skin_concern_id = :concernId
        WHERE p.category_id IN (:categoryIds) 
          
          -- 1. 여성 유저일 경우 '남성 화장품(ID: 4)' 카테고리 원천 차단 (JOIN 없이 초고속 필터링!)
          AND NOT (:gender = 'women' AND c.big_category_id = 4)
          
          -- 2. 피부타입별 상위 25% 컷오프
          AND (
               (:skinType = '수부지' AND p.score_combination >= 36) OR
               (:skinType = '건성' AND p.score_dry >= 66) OR
               (:skinType = '지성' AND p.score_oily >= 70) OR
               (:skinType = '복합성' AND p.score_subuji >= 39)
          )
          
          -- 3. 코메도제닉 필터 (수부지/지성일 때 모공 막는 성분 무조건 Drop!)
          AND (p.has_comedogenic = FALSE OR :skinType IN ('건성', '복합성'))
          
        ORDER BY (
            CASE WHEN :skinType = '수부지' THEN p.score_combination
                 WHEN :skinType = '건성' THEN p.score_dry
                 WHEN :skinType = '지성' THEN p.score_oily
                 ELSE p.score_subuji END
            + COALESCE(pcc.total_concern_score, 0)
        ) DESC 
        LIMIT 50
    """)
    List<Product> findInitialRecommendations(
            @Param("categoryIds") List<Long> categoryIds,
            @Param("skinType") String skinType,
            @Param("gender") String gender,
            @Param("concernId") Long concernId
    );


    // =================================================================================
    // [분기 B] 장바구니에 제품이 있을 때 (루틴 갭 보정)
    // =================================================================================
    @Query(nativeQuery = true, value = """
        SELECT DISTINCT p.*
        FROM Products p
        JOIN Category c ON p.category_id = c.category_id
        LEFT JOIN ProductConcernCache pcc ON p.product_id = pcc.product_id AND pcc.skin_concern_id = :concernId
        WHERE p.category_id IN (:categoryIds)
          
          -- [기본 필터] 남성 화장품(ID: 4) 제외, 상위 25% 컷오프, 코메도제닉 필터
          AND NOT (:gender = 'women' AND c.big_category_id = 4)
          AND (
               (:skinType = '수부지' AND p.score_combination >= 36) OR
               (:skinType = '건성' AND p.score_dry >= 66) OR
               (:skinType = '지성' AND p.score_oily >= 70) OR
               (:skinType = '복합성' AND p.score_subuji >= 39)
          )
          AND (p.has_comedogenic = FALSE OR :skinType IN ('건성', '복합성'))
          
          -- 4. 이미 장바구니(Redis)에 담긴 제품은 추천에서 제외!
          AND p.product_id NOT IN (:currentIds)
          
        ORDER BY (
            -- [기본 점수] 피부타입 점수 + 피부고민 점수
            (CASE WHEN :skinType = '수부지' THEN p.score_combination
                  WHEN :skinType = '건성' THEN p.score_dry
                  WHEN :skinType = '지성' THEN p.score_oily
                  ELSE p.score_subuji END)
            + COALESCE(pcc.total_concern_score, 0)
            
            -- 5. 실시간 유수분 갭 보정 페널티!
            - (ABS(p.m_score - :targetM) * 5.0) 
            - (ABS(p.o_score - :targetO) * 5.0)
        ) DESC 
        LIMIT 50
    """)
    List<Product> findRoutineCandidates(
            @Param("categoryIds") List<Long> categoryIds,
            @Param("skinType") String skinType,
            @Param("gender") String gender,
            @Param("concernId") Long concernId,
            @Param("targetM") double targetM,
            @Param("targetO") double targetO,
            @Param("currentIds") List<Long> currentIds
    );
}





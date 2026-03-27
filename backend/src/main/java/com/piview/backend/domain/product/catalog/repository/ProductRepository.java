package com.piview.backend.domain.product.catalog.repository;

import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.skin.common.SkinTypeEnum;
import com.piview.backend.domain.skin.survey.entity.SurveyGender;
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
        SELECT p.*
        FROM products p
        JOIN category c ON p.category_id = c.category_id
        LEFT JOIN product_concern_cache pcc ON p.product_id = pcc.product_id AND pcc.skin_concern_id = :concernId
        WHERE p.category_id IN (:categoryIds) -- 루틴 스텝에 맞는 여러 소카테고리 ID 검색
          
          -- 1. 여성 유저일 경우 '남성 화장품(ID: 4)' 카테고리 원천 차단
          AND NOT (:#{#gender.name()} = 'WOMEN' AND c.big_category_id = 4)
          
          -- 2. 피부타입별 상위 25% 컷오프
          AND (
               (:#{#skinType.name()} = 'subuji' AND p.score_subuji >= 36) OR
               (:#{#skinType.name()} = 'dry' AND p.score_dry >= 66) OR
               (:#{#skinType.name()} = 'oily' AND p.score_oily >= 70) OR
               (:#{#skinType.name()} = 'combination' AND p.score_combination >= 39)
          )
          
          -- 3. 코메도제닉 필터 (수부지/지성일 때 모공 막는 성분 무조건 Drop!)
          AND (p.has_comedogenic = FALSE OR :#{#skinType.name()} IN ('dry', 'combination'))

          -- 4. 사용자가 등록한 '안 맞는 제품' 제외
          AND p.product_id NOT IN (:dislikedIds)

          -- 5. 사용자가 피해야 할 성분이 포함된 제품 제외
          AND p.product_id NOT IN (
              SELECT DISTINCT pi_sub.product_id
              FROM product_ingredients pi_sub
              JOIN ingredients i ON pi_sub.product_ingredients_ko LIKE CONCAT('%', CHAR(39), i.name_ko, CHAR(39), '%')
              WHERE i.ingredient_id IN (:avoidIngredientIds)
          )
          
        ORDER BY (
            CASE WHEN :#{#skinType.name()} = 'subuji' THEN p.score_subuji
                 WHEN :#{#skinType.name()} = 'dry' THEN p.score_dry
                 WHEN :#{#skinType.name()} = 'oily' THEN p.score_oily
                 ELSE p.score_combination END
            + COALESCE(pcc.total_concern_score, 0)
        ) DESC 
        LIMIT 50
    """)
    List<Product> findInitialRecommendations(
            @Param("categoryIds") List<Long> categoryIds,
            @Param("skinType") SkinTypeEnum skinType,
            @Param("gender") SurveyGender gender,
            @Param("concernId") Long concernId,
            @Param("dislikedIds") List<Long> dislikedIds,
            @Param("avoidIngredientIds") List<Long> avoidIngredientIds
    );


    // =================================================================================
    // [분기 B] 장바구니에 제품이 있을 때 (루틴 갭 보정)
    // =================================================================================
    @Query(nativeQuery = true, value = """
        SELECT p.*
        FROM products p
        JOIN category c ON p.category_id = c.category_id
        LEFT JOIN product_concern_cache pcc ON p.product_id = pcc.product_id AND pcc.skin_concern_id = :concernId
        WHERE p.category_id IN (:categoryIds)
          
          -- [기본 필터] 남성 화장품(ID: 4) 제외, 상위 25% 컷오프, 코메도제닉 필터
          AND NOT (:#{#gender.name()} = 'WOMEN' AND c.big_category_id = 4)
          AND (
               (:#{#skinType.name()} = 'subuji' AND p.score_subuji >= 36) OR
               (:#{#skinType.name()} = 'dry' AND p.score_dry >= 66) OR
               (:#{#skinType.name()} = 'oily' AND p.score_oily >= 70) OR
               (:#{#skinType.name()} = 'combination' AND p.score_combination >= 39)
          )
          AND (p.has_comedogenic = FALSE OR :#{#skinType.name()} IN ('dry', 'combination'))
          
          -- 4. 이미 장바구니(Redis)에 담긴 제품은 추천에서 제외!
          AND p.product_id NOT IN (:currentIds)

          -- 5. 사용자가 등록한 '안 맞는 제품' 제외
          AND p.product_id NOT IN (:dislikedIds)

          -- 6. 사용자가 피해야 할 성분이 포함된 제품 제외
          AND p.product_id NOT IN (
              SELECT DISTINCT pi_sub.product_id
              FROM product_ingredients pi_sub
              JOIN ingredients i ON pi_sub.product_ingredients_ko LIKE CONCAT('%', CHAR(39), i.name_ko, CHAR(39), '%')
              WHERE i.ingredient_id IN (:avoidIngredientIds)
          )
          
        ORDER BY (
            -- [기본 점수] 피부타입 점수 + 피부고민 점수
            (CASE WHEN :#{#skinType.name()} = 'subuji' THEN p.score_subuji
                  WHEN :#{#skinType.name()} = 'dry' THEN p.score_dry
                  WHEN :#{#skinType.name()} = 'oily' THEN p.score_oily
                  ELSE p.score_combination END)
            + COALESCE(pcc.total_concern_score, 0)
            
            -- 5. 실시간 유수분 갭 보정 페널티!
            - (ABS(p.m_score - :targetM) * 5.0) 
            - (ABS(p.o_score - :targetO) * 5.0)
        ) DESC 
        LIMIT 50
    """)
    List<Product> findRoutineCandidates(
            @Param("categoryIds") List<Long> categoryIds,
            @Param("skinType") SkinTypeEnum skinType,
            @Param("gender") SurveyGender gender,
            @Param("concernId") Long concernId,
            @Param("targetM") double targetM,
            @Param("targetO") double targetO,
            @Param("currentIds") List<Long> currentIds,
            @Param("dislikedIds") List<Long> dislikedIds,
            @Param("avoidIngredientIds") List<Long> avoidIngredientIds
    );
}





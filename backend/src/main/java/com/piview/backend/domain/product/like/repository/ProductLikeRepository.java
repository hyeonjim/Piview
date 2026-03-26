package com.piview.backend.domain.product.like.repository;

import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.product.like.entity.ProductLike;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.security.core.parameters.P;

public interface ProductLikeRepository extends JpaRepository<ProductLike, Long> {

  // 유저 ID와 화장품 ID를 줘서 좋아요 기록이 있는지 찾아옵니다.
  @Query("SELECT pl FROM ProductLike pl WHERE pl.user.id = :userId AND pl.product.productId = :productId")
  Optional<ProductLike> findByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);

  // 사용자 ID를 기준으로 좋아요 목록 조회
  @Query("SELECT pl.product.productId FROM ProductLike pl WHERE pl.user.id = :userId")
  List<Long> findLikedProductIdsByUserId(@Param("userId") Long userId);

  // 사용자가 좋아요를 누른 제품 객체(Product) 전체 목록 조회
  @Query("SELECT pl.product FROM ProductLike pl JOIN pl.product p WHERE pl.user.id = :userId")
  List<Product> findProductsByUserId(@Param("userId") Long userId);

  //추천된 제품 10개의 ID 중, 이 유저가 좋아욯나 제품의 ID만 Set으로 반환
  @Query("SELECT l.product.productId FROM ProductLike l WHERE l.user.id = :userId AND l.product.productId IN :productIds")
  Set<Long> findLikedProductIds(@Param("userId") Long userId, @Param("productIds") List<Long> productIds);
}
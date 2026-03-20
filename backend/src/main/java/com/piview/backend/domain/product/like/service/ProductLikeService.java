package com.piview.backend.domain.product.like.service;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.domain.product.catalog.dto.ProductSummaryResponse;
import com.piview.backend.domain.product.catalog.repository.ProductRepository;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.product.like.entity.ProductLike;
import com.piview.backend.domain.product.like.repository.ProductLikeRepository;
import com.piview.backend.domain.user.login.entity.User;
import com.piview.backend.domain.user.login.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductLikeService {

  private final ProductLikeRepository productLikeRepository;
  private final UserRepository userRepository;
  private final ProductRepository productRepository;

  @Transactional
  public boolean toggleLike(Long userId, Long productId) {
    // 유저가 이 화장품에 누른 좋아요가 있는지 확인
    Optional<ProductLike> existingLike = productLikeRepository.findByUserIdAndProductId(userId, productId);

    if (existingLike.isPresent()) {
      // 이미 좋아요가 있다면? -> 삭제 (좋아요 취소)
      productLikeRepository.delete(existingLike.get());
      return false; // 프론트엔드에게 "취소됨(false)" 이라고 알려주기 위함

    } else {
      // 좋아요가 없다면? -> 새로 생성 (좋아요 추가)
      User user = userRepository.findById(userId)
          .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
      Product product = productRepository.findByProductId(productId)
          .orElseThrow(() -> new CustomException(ErrorCode.COSMETICS_NOT_FOUND));
      ProductLike newLike = ProductLike.builder()
          .user(user)
          .product(product)
          .build();

      productLikeRepository.save(newLike);
      return true; // 프론트엔드에게 "추가됨(true)" 이라고 알려주기 위함
    }
  }
  public List<ProductSummaryResponse> getMyLikedProducts(Long userId) {

    // 중간 테이블을 거쳐서 내가 좋아요 한 'Product' 엔티티 목록을 쫙 가져옵니다.
    List<Product> likedProducts = productLikeRepository.findProductsByUserId(userId);

    // 이미 잘 만들어둔 DTO로 변환합니다. (내 찜 목록이니까 isLiked는 무조건 true!)
    return likedProducts.stream()
        .map(product -> ProductSummaryResponse.from(product, true))
        .toList();
  }
}
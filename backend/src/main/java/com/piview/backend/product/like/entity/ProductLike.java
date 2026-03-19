package com.piview.backend.product.like.entity;

import com.piview.backend.product.entity.Product;
import com.piview.backend.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "likes")
public class ProductLike {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "like_id")
  private Long id;

  // 누가 좋아요를 눌렀는지
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  // 어떤 화장품에 좋아요를 눌렀는지
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "product_id", nullable = false)
  private Product product;

  @Builder
  public ProductLike(User user, Product product) {
    this.user = user;
    this.product = product;
  }
}
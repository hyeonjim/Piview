package com.piview.backend.product.like.entity;

import com.piview.backend.product.entity.Product;
import com.piview.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "likes", uniqueConstraints = {
    @UniqueConstraint(
        name = "uk_user_product_like",
        columnNames = {"user_id", "product_id"} // 테이블에 생성될 컬럼명 기준
    )
})
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
  @JoinColumn(name = "product_id", nullable = false, referencedColumnName = "product_id")
  private Product product;

  @Builder
  public ProductLike(User user, Product product) {
    this.user = user;
    this.product = product;
  }
}
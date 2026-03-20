package com.piview.backend.domain.product.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ProductConcernCache")
@Getter
@NoArgsConstructor
public class ProductConcernCache {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "product_concern_cache_id", nullable = false)
  private Long id;

  @Column(name = "product_id", nullable = false)
  private Long productId;

  @Column(name = "skin_concern_id", nullable = false)
  private Long skinConcernId;

  @Column(name = "total_concern_score", nullable = false)
  private Long totalConcernScore; // 해당 제품이 해당 고민에 대해 얻은 총점
}
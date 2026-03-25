package com.piview.backend.domain.product.dynamic.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "RecommendationScore" , indexes = {
    @Index(name="idx_user_score", columnList = "user_id, score DESC")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecommendationScore {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "product_id", nullable = false)
  private Long productId;

  @Column(name = "score", nullable = false, precision = 5, scale = 2)
  private BigDecimal score;

  // 배치 갱신 시간을 알기 위한 필드
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
}

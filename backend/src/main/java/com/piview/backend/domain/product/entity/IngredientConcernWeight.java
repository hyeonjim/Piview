package com.piview.backend.domain.product.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "IngredientConcernWeight")
@Getter
@NoArgsConstructor
public class IngredientConcernWeight {

  @Id
  @Column(name = "ingredient_concern_weight_id", nullable = false)
  private Long id;

  @Column(name = "ingredient_id", nullable = false)
  private Long ingredientId;

  @Column(name = "skin_concern_id", nullable = false)
  private Long skinConcernId;

  @Column(name = "weight_score")
  private Long weightScore; // 성분이 피부고민에 부여하는 가점 (+15, +10, +5)
}
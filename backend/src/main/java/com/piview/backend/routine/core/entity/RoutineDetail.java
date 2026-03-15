package com.piview.backend.routine.core.entity;

import com.piview.backend.product.entity.Product;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RoutineDetail {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "routine_detail_id", nullable = false)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "routine_id", nullable = false)
  private MyRoutine myRoutine;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "routine_col_id", nullable = false)
  private RoutineColumn routineColumn;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "product_id")
  private Product productId;

  @Column(name = "step_order", nullable = false)
  private Integer stepOrder;

  @Builder
  public RoutineDetail(MyRoutine myRoutine, RoutineColumn routineColumn, Product productId, Integer stepOrder) {
    this.myRoutine = myRoutine;
    this.routineColumn = routineColumn;
    this.productId = productId;
    this.stepOrder = stepOrder;
  }

  // 순서 변경을 위한 메서드
  public void updateStepOrder(Integer newOrder) {
    this.stepOrder = newOrder;
  }
}

package com.piview.backend.routine.core.entity;

import com.piview.backend.global.util.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MyRoutine extends BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "routine_id")
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(nullable = false, length = 20)
  private String title;

  @Column(name = "is_main", nullable = false)
  private boolean isMain;

  @OneToMany(mappedBy = "myRoutine", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<RoutineDetail> details = new ArrayList<>();

  @Builder
  public MyRoutine(Long userId, String title, boolean isMain) {
    this.userId = userId;
    this.title = title;
    this.isMain = isMain;
  }

  public void changeMainStatus(boolean isMain) {
    this.isMain = isMain;
  }
}

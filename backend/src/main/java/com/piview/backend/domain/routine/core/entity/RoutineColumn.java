package com.piview.backend.domain.routine.core.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class RoutineColumn {
  @Id
  @Column(name = "routine_col_id")
  private Integer id;

  @Column(name = "routine_col_name", length = 20, nullable = false)
  private String name;
}
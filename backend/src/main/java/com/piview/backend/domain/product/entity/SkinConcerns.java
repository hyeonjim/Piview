package com.piview.backend.domain.product.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "SkinConcerns")
@Getter
@NoArgsConstructor
public class SkinConcerns {

  @Id
  // @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "skin_concern_id", nullable = false)
  private Long id;

  @Column(name = "concern_name", length = 15, nullable = false)
  private String concernName;
}

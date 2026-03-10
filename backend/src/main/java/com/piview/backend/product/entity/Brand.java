package com.piview.backend.product.entity;

import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "Brand")
@Getter
public class Brand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "brand_id")
    private Long id;    // 브랜드 ID

    @Column(name = "brand_name")
    private String brandName;   // 브랜드 이름
}

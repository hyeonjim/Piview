package com.piview.backend.domain.product.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ProductIngredients")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class ProductIngredients {

    @Id
    @Column(name = "product_id")
    private Long productId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "product_ingredients_ko", columnDefinition = "TEXT")
    private String productIngredientsKo;

    @Column(name = "product_ingredients_en", columnDefinition = "TEXT")
    private String productIngredientsEn;
}

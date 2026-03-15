package com.piview.backend.product.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ProductIngredients")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class ProductIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long productIngredientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    /*
    ingredient_id가 null인 경우: 성분명은 있는데 DB에 없는 성분이라면?
    @ManyToOne -> optional = true
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id")
    private Ingredient ingredient;

    @Column(name = "name_ko")
    private String nameKo;

    @Column(name = "name_en")
    private String nameEn;

    @Column(name = "position")
    private Integer position;     // 성분 순서(앞일 수록 함량이 높아서 가중치를 부여해야 함)

    @Column(name = "is_matched", nullable = false)
    private Boolean isMatched;
}

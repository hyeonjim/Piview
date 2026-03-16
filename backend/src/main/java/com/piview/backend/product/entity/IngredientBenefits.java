package com.piview.backend.product.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ingredient_benefits",
        uniqueConstraints = @UniqueConstraint(
        columnNames = {"ingredient_id", "benefit"}
    ))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class IngredientBenefits {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ingredientBenefit_id")
    private Long ingredientBenefitId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id")
    private Ingredient ingredient;

    @Column(name = "benefit", nullable = false)
    @Enumerated(EnumType.STRING)
    private BenefitEnum benefit;
}

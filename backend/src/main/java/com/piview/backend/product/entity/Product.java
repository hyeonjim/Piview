package com.piview.backend.product.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "Products")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "product_id", nullable = false, unique = true)
    private Long productId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "image_id")
    private Image image;

    @Column(name = "name", length = 70)
    private String name;

    @Column(name = "volume")
    private String volume;

    @Column(name = "price")
    private Integer price;

    @Column(name = "store")
    private Integer store;

    @Column(name = "score_dry", precision = 5, scale = 2)
    private BigDecimal scoreDry;

    @Column(name = "score_oily", precision = 5, scale = 2)
    private BigDecimal scoreOily;

    @Column(name = "score_subuji", precision = 5, scale = 2)
    private BigDecimal scoreSubuji;

    @Column(name = "score_combination", precision = 5, scale = 2)
    private BigDecimal scoreCombination;

    @Column(name = "has_comedogenic")
    private Boolean hasComedogenic;

    @Column(name = "m_score", precision = 5, scale = 2)
    private BigDecimal mScore;

    @Column(name = "o_score", precision = 5, scale = 2)
    private BigDecimal oScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "top_skin_type")
    private SkinTypeEnum topSkinType;

    @Enumerated(EnumType.STRING)
    @Column(name = "top2_skin_type")
    private SkinTypeEnum top2SkinType;

    @OneToOne(mappedBy = "product", fetch = FetchType.LAZY)
    private ProductIngredients productIngredients;

    @Column(name = "has_retinol")
    private Boolean hasRetinol;

    @Column(name = "has_acid")
    private Boolean hasAcid;

    @Column(name = "has_pure_vit_c")
    private Boolean hasPureVitC;

    @Column(name = "has_copper_pep")
    private Boolean hasCopperPep;

    @Column(name = "has_niacinamide")
    private Boolean hasNiacinamide;

    @Column(name = "has_benzoyl")
    private Boolean hasBenzoyl;

    @Column(name = "has_protein")
    private Boolean hasProtein;

    @Column(name = "has_arbutin")
    private Boolean hasArbutin;

}

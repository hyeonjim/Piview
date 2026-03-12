package com.piview.backend.product.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Products")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Product {

    @Id
    @Column(name = "product_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", referencedColumnName = "brand_id")
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "image_id")
    private Image image;

    @Column(name = "skin_type_id")
    private Integer skinTypeId;

    @Column(name = "name", length = 70)
    private String name;

    @Column(name = "ingredients", columnDefinition = "TEXT")
    private String ingredients;     // 원본 전성분 문자열 (보관용)

    @Column(name = "price")
    private Integer price;

    @Column(name = "store")
    private Integer store;

    /**
     * mappedBy = "product" 연관관계 주인: ProductSkinScore.product 필드
     * ProductSkinScores 테이블의 FK(product_id)는 ProductSkinScore Entity가 관리
     * Product는 읽기 전용으로 참조만!
     */
    @OneToOne(mappedBy = "product", fetch = FetchType.LAZY)
    private ProductSkinScore skinScore;

    /**
     * @Builder.default: null 대신 ArrayList로 초기화
     */
    @Builder.Default
    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    private List<ProductIngredient> productIngredients = new ArrayList<>();
}

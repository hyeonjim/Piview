package com.piview.backend.domain.product.dynamic.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ProductSimilarity", indexes = {
        @Index(name = "idx_product_similarity", columnList = "product_id, similarity_score DESC")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductSimilarity {

    @Id@GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "related_product_id", nullable = false)
    private Long relatedProductId; // 함께 본 연관 상품 ID

    @Column(name = "similarity_score", nullable = false)
    private Long similarityScore; // 두 상품을 함께 본 유저 수 (연관도 점수)
}

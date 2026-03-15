package com.piview.backend.product.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;


/**
 * @MapsId: 공유 PK
 * 테이블이 Products.product_id를 그대로 사용하니까
 *
 * @MapsId 동작 방식
 * product가 세팅되면 product.productId 값이 자동으로 this.id (PK)에도 복사
 */
@Entity
@Table(name = "ProductSkinScores")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class ProductSkinScore {

    @Id
    @Column(name = "product_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "score_dry", precision = 5, scale = 2)
    private BigDecimal scoreDry;

    @Column(name = "score_oily", precision = 5, scale = 2)
    private BigDecimal scoreOily;

    @Column(name = "score_combination", precision = 5, scale = 2)
    private BigDecimal scoreCombination;

    @Column(name = "score_subuji", precision = 5, scale = 2)
    private BigDecimal scoreSubuji;

    @Column(name = "top_skin_type")
    @Enumerated(EnumType.STRING)
    private SkinTypeEnum topSkinType;

    @Column(name = "top2_skin_type")
    @Enumerated(EnumType.STRING)
    private SkinTypeEnum top2SkinType;
}

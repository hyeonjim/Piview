package com.piview.backend.domain.product.entity;


import com.piview.backend.domain.skin.common.SkinTypeEnum;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "CategoryIdealScore")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class CategoryIdealScore {

    @Id
    @Column(name = "category_ideal_score_id")
    private Long categoryIdealScoreId;

    @Enumerated(EnumType.STRING)
    @Column(name = "skin_type")
    private SkinTypeEnum skinType;

    @Column(name = "routine_col_id")
    private Long routineColId;

    @Column(name = "ideal_m", precision = 5, scale = 2)
    private BigDecimal idealM;

    @Column(name = "ideal_o", precision = 5, scale = 2)
    private BigDecimal idealO;
}

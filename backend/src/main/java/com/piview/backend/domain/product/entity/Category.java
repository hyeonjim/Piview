package com.piview.backend.domain.product.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Category")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Category {

    @Id
    @Column(name = "category_id")
    private Long categoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "big_category_id")
    private BigCategory bigCategory;

    @Column(name = "category_name")
    private String categoryName;
}

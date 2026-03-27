package com.piview.backend.domain.product.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "BigCategory")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class BigCategory {

    @Id
    @Column(name = "big_category_id")
    private Integer bigCategoryId;

    @Column(name = "big_category_name")
    private String bigCategoryName;
}

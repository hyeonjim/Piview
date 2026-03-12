package com.piview.backend.product.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "Images")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class ProductImage {

    @Id
    @Column(name = "image_id")
    private Long imageId;

    @Column(name = "url", columnDefinition = "TEXT")
    private String url;
}

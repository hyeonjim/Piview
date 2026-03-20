package com.piview.backend.domain.product.entity;

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
public class Image {

    /**
     * product <-> imageUrl: 한 상품 당 하나의 이미지로 매칭된다.
     */
    @Id
    @Column(name = "image_id")
    private Long imageId;

    @Column(name = "url", columnDefinition = "TEXT")
    private String url;
}

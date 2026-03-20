package com.piview.backend.domain.product.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "Tag")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Tag {

    @Id
    @Column(name = "tag_id")
    private Long tagId;

    @Column(name = "tag")
    private String tag;
}

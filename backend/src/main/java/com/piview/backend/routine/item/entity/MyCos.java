package com.piview.backend.routine.item.entity;

import com.piview.backend.product.entity.Product;
import com.piview.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "my_cos")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MyCos {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "my_cos_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
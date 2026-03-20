package com.piview.backend.domain.routine.item.entity;

import com.piview.backend.global.util.BaseEntity;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.user.login.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "my_cos")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@SQLDelete(sql = "UPDATE my_cos SET deleted_at = CURRENT_TIMESTAMP WHERE my_cos_id = ?")
@SQLRestriction("deleted_at IS NULL")
public class MyCos extends BaseEntity {

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

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}

package com.piview.backend.domain.product.catalog.repository;

import com.piview.backend.domain.product.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findAllByOrderByTagAsc();
}

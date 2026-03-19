package com.piview.backend.product.catalog.repository;

import com.piview.backend.product.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findAllByOrderByTagAsc();
}

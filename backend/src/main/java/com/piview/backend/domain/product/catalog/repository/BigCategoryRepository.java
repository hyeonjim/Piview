package com.piview.backend.domain.product.catalog.repository;

import com.piview.backend.domain.product.entity.BigCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BigCategoryRepository extends JpaRepository<BigCategory, Integer> {

    List<BigCategory> findAllByOrderByBigCategoryIdAsc();
}

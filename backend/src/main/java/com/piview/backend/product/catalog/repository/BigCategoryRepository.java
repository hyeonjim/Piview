package com.piview.backend.product.catalog.repository;

import com.piview.backend.product.entity.BigCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BigCategoryRepository extends JpaRepository<BigCategory, Integer> {

    List<BigCategory> findAllByOrderByBigCategoryIdAsc();
}

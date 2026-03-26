package com.piview.backend.domain.product.catalog.repository;

import com.piview.backend.domain.product.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByOrderByBigCategory_BigCategoryIdAscCategoryIdAsc();
}

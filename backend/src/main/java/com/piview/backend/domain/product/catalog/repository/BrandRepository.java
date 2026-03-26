package com.piview.backend.domain.product.catalog.repository;

import com.piview.backend.domain.product.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BrandRepository extends JpaRepository<Brand, Long> {

    List<Brand> findAllByOrderByBrandNameAsc();
}

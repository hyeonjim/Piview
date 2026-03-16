package com.piview.backend.product.catalog.repository;

import com.piview.backend.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;


public interface ProductRepository extends JpaRepository<Product, Long>, ProductRepositoryCustom {

}

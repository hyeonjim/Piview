package com.piview.backend.domain.ocr.recognition.repository;

import com.piview.backend.domain.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OcrProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByBrand_BrandNameContainingOrNameContaining(String brandName, String productName);
}
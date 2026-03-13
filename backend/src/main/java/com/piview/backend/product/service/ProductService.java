package com.piview.backend.product.service;

import com.piview.backend.product.repository.ProductIngredientRepository;
import com.piview.backend.product.repository.ProductRepository;
import com.piview.backend.product.repository.ProductTagScoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor

public class ProductService {

    private final ProductRepository productRepository;
    private final ProductIngredientRepository productIngredientRepository;
    private final ProductTagScoreRepository productTagScoreRepository;

    public List <ProductSummaryResponse> searchProducts(String name, String brand,
                                                        Long categoryId, Integer bigCategoryId,
                                                        String skinType, )
}

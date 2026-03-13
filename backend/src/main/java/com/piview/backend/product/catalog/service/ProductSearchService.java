package com.piview.backend.product.catalog.service;

import com.piview.backend.product.catalog.dto.ProductSearchPageResponseDto;
import com.piview.backend.product.catalog.dto.ProductSearchResponseDto;
import com.piview.backend.product.catalog.repository.ProductSearchRepository;
import com.piview.backend.product.entity.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 읽기 전용 트랜잭션으로 성능 최적화
public class ProductSearchService {

  private final ProductSearchRepository productSearchRepository;

  public ProductSearchPageResponseDto searchProducts(String rawKeyword, Pageable pageable, Long userId) {
    // 검색어 띄어쓰기 무시를 위한 전처리
    String keyword = rawKeyword.replaceAll("\\s+", "");

    // 검색 전용 레포지토리에서 Slice(페이징) 결과 조회
    Slice<Product> productSlice = productSearchRepository.searchByBrandOrProductName(keyword, pageable);

    // Search 전용 개별 record로 매핑
    List<ProductSearchResponseDto> productDtos = productSlice.getContent().stream()
        .map(ProductSearchResponseDto::from)
        .toList();

    // Search 전용 페이징 record로 포장해서 반환
    return ProductSearchPageResponseDto.builder()
        .products(productDtos)
        .hasNext(productSlice.hasNext())
        .page(pageable.getPageNumber())
        .size(pageable.getPageSize())
        .build();
  }
}
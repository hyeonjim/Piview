package com.piview.backend.domain.product.dynamic.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class EventLogRequest {

  private Long userId;        // 로그인한 유저 ID
  private String eventType;     // VIEW_PRODUCT, ADD_WISHLIST, SEARCH 등
  private Long productId;       // 클릭한 상품 ID (검색일 땐 null)
  private String searchKeyword; // 검색어 (상품 클릭일 땐 null)
  private String timestamp;     // 프론트엔드에서 보낸 시간 (ISO-8601)
}

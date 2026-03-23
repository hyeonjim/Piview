package com.piview.backend.domain.product.aisummary.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProductLine12SummaryResponse {
  private Long productId;
  private String productName;
  private String line1AiSummary;       // AI 기반 리뷰 요약
  private String line2PersonalizedMsg; // 사용자 맞춤형 피부 고민 메시지
  private String line3AiSummary;  // AI 기반 에디터 팁 및 주의사항
}

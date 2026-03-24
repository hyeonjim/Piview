package com.piview.backend.domain.product.aisummary.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AiSummaryResponse {
  private String line1;
  private String line2;
  private String line3;
}
package com.piview.backend.product.s3.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.List;

@Getter
@AllArgsConstructor
public class S3UploadResponseDto {
  private List<String> imageUrls;
}

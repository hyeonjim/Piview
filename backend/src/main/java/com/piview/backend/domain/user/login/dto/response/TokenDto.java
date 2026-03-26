package com.piview.backend.domain.user.login.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class TokenDto {
  private String accessToken;
  private String refreshToken;
}

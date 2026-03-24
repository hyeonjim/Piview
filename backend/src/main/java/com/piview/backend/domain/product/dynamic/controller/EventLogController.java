package com.piview.backend.domain.product.dynamic.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.piview.backend.domain.product.dynamic.dto.EventLogRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/logs")
public class EventLogController {

  private static final Logger ACTION_LOGGER = LoggerFactory.getLogger("USER_ACTION_LOGGER");
  private final ObjectMapper objectMapper;

  @PostMapping("/events")
  public ResponseEntity<Void> collectUserAction(@RequestBody EventLogRequest request) {
    try {
      String jsonString = objectMapper.writeValueAsString(request);
      ACTION_LOGGER.info(jsonString);
//      log.info(jsonString);

    } catch (Exception e) {
      log.error("사용자 행동 로그 기록 실패: {}", request, e);
    }
    return ResponseEntity.ok().build();
  }
}

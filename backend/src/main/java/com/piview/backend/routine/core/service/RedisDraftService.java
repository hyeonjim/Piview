package com.piview.backend.routine.core.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.piview.backend.routine.core.dto.DraftItemDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RedisDraftService {

  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;

  // 레디스에 저장될 키의 접두사 (예: routine:draft:1)
  private static final String DRAFT_KEY_PREFIX = "routine:draft:";

  // 레디스 저장
  public void saveDraftItems(Long userId, List<DraftItemDto> items) {
    String key = DRAFT_KEY_PREFIX + userId;
    try {
      // 객체 리스트를 JSON 문자열로 변환하여 Redis에 저장
      String json = objectMapper.writeValueAsString(items);
      redisTemplate.opsForValue().set(key, json);
    } catch (Exception e) {
      throw new RuntimeException("Redis 데이터 저장 중 오류가 발생했습니다.", e);
    }
  }

  // 레디스 조회
  public List<DraftItemDto> getDraftItems(Long userId) {
    String key = DRAFT_KEY_PREFIX + userId;
    String json = redisTemplate.opsForValue().get(key);

    if (json == null || json.isEmpty()) {
      return Collections.emptyList();
    }

    try {
      // JSON 문자열을 다시 객체 리스트로 변환
      return objectMapper.readValue(json, new TypeReference<List<DraftItemDto>>() {});
    } catch (Exception e) {
      throw new RuntimeException("Redis 데이터 읽기 중 오류가 발생했습니다.", e);
    }
  }

  // 저장 완료되면 레디스 초기화
  public void clearDraft(Long userId) {
    redisTemplate.delete(DRAFT_KEY_PREFIX + userId);
  }
}

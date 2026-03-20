package com.piview.backend.domain.routine.core.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.piview.backend.domain.routine.core.dto.RoutineDraftDto;
import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
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
  public void saveDraftItems(Long userId, List<RoutineDraftDto.DraftItemDto> items) {
    String key = DRAFT_KEY_PREFIX + userId;
    try {
      // 객체 리스트를 JSON 문자열로 변환하여 Redis에 저장
      String json = objectMapper.writeValueAsString(items);
      redisTemplate.opsForValue().set(key, json, 7, java.util.concurrent.TimeUnit.DAYS);
    } catch (Exception e) {
      throw new CustomException(ErrorCode.REDIS_SAVE_FAILED);
    }
  }

  // 레디스 조회
  public List<RoutineDraftDto.DraftItemDto> getDraftItems(Long userId) {
    String key = DRAFT_KEY_PREFIX + userId;
    String json = redisTemplate.opsForValue().get(key);

    if (json == null || json.isEmpty()) {
      return Collections.emptyList();
    }

    try {
      // JSON 문자열을 다시 객체 리스트로 변환
      return objectMapper.readValue(json, new TypeReference<List<RoutineDraftDto.DraftItemDto>>() {});
    } catch (Exception e) {
      throw new CustomException(ErrorCode.REDIS_SAVE_FAILED);
    }
  }

  // 제품을 루틴(redis)에서 삭제
  public void removeProductFromDraft(Long userId, Long productId) {
    // 기존 장바구니 불러오기
    List<RoutineDraftDto.DraftItemDto> currentDraft = getDraftItems(userId);

    if (currentDraft == null || currentDraft.isEmpty()) {
      return; // 장바구니가 비어있으면 무시
    }

    // 삭제하려는 productId와 일치하지 않는 제품들만 남기기 (필터링)
    List<RoutineDraftDto.DraftItemDto> updatedDraft = currentDraft.stream()
        .filter(item -> item.product() != null && !item.product().getProductId().equals(productId))
        .toList();

    // 업데이트된 리스트를 다시 Redis에 저장 (해당 제품만 쏙 빠진 채로 덮어쓰기)
    saveDraftItems(userId, updatedDraft);
  }

  // 저장 완료되면 레디스 초기화
  public void clearDraft(Long userId) {
    redisTemplate.delete(DRAFT_KEY_PREFIX + userId);
  }
}

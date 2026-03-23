package com.piview.backend.domain.product.recommend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.piview.backend.domain.product.recommend.dto.RedisRoutineItemDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RedisRoutineService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Redis에서 임시 루틴을 조회하여 제품 ID 목록만 추출합니다.
     */
    public List<Long> getDraftProductsIds(Long userId) throws JsonProcessingException {
        String redisKey = "routine:draft:" + userId;
        String json = redisTemplate.opsForValue().get(redisKey);

        if (json == null || json.isEmpty()){
            return new ArrayList<>();
        }

        try{
            List<RedisRoutineItemDto> draftItems = objectMapper.readValue(json, new TypeReference<List<RedisRoutineItemDto>>() {});

            return draftItems.stream()
                    .filter(item -> item != null && item.getProduct() != null && item.getProduct().getProductId() != null)
                    .map(item -> item.getProduct().getProductId())
                    .collect(Collectors.toList());
        } catch (Exception e){
            throw new RuntimeException("Redis 루틴 데이터를 파싱하는 중 오류가 발생했습니다.",e);
        }
    }
}

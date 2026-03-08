package com.piview.backend.global.redis; // PiView 패키지 경로로 변경

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RedisService {

    private final RedisTemplate<String, String> redisTemplate;

    // 데이터 저장 (리프레시 토큰의 유효기간 설정에 사용)
    public void setValues(String key, String data, Duration duration){
        ValueOperations<String, String> values = redisTemplate.opsForValue();
        values.set(key, data, duration);
    }

    // 데이터 조회
    public String getValues(String key){
        ValueOperations<String, String> values = redisTemplate.opsForValue();
        return values.get(key);
    }

    // 데이터 삭제 (로그아웃 시 리프레시 토큰 파기 용도)
    public void deleteValues(String key){
        redisTemplate.delete(key);
    }

    // 키 존재 여부 확인
    public boolean checkExistsValue(String key){
        // value.equals("false") 대신 Redis의 hasKey() 메서드 사용 권장
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
}
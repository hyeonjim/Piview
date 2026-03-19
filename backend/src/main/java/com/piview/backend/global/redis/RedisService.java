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
        // String 직렬화 RedisTemplate 을 사용하므로 key, value 모두 문자열로 저장한다.
        // duration 이 지나면 Redis 가 키를 자동 삭제한다.
        ValueOperations<String, String> values = redisTemplate.opsForValue();
        values.set(key, data, duration);
    }

    // Redis SETNX(존재하지 않을 때만 저장) + TTL 동작이다.
    // 이미 key 가 있으면 false, 새로 저장되면 true 를 반환한다.
    public boolean setValuesIfAbsent(String key, String data, Duration duration) {
        ValueOperations<String, String> values = redisTemplate.opsForValue();
        return Boolean.TRUE.equals(values.setIfAbsent(key, data, duration));
    }

    // 데이터 조회
    public String getValues(String key){
        // 존재하지 않는 키면 null 을 반환한다.
        ValueOperations<String, String> values = redisTemplate.opsForValue();
        return values.get(key);
    }

    // 데이터 삭제 (로그아웃 시 리프레시 토큰 파기 용도)
    public void deleteValues(String key){
        // 키가 없어도 예외 없이 종료된다.
        redisTemplate.delete(key);
    }

    // 키 존재 여부 확인
    public boolean checkExistsValue(String key){
        // hasKey() 는 Boolean wrapper 를 반환하므로 null 가능성을 막기 위해 TRUE 비교를 사용한다.
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
}

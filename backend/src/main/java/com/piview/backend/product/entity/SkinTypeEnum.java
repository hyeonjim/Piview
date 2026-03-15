package com.piview.backend.product.entity;

/**
 * DB의 ENUM 값
 * - 건성, 지성, 복합성, 수부지
 * - 소문자로 저장한 이유: @Enumerated(EnumType.STRING) 저장을 위해
 */
public enum SkinTypeEnum {
    dry, oily, combination, subuji
}

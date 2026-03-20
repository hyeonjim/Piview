package com.piview.backend.domain.skin.common;

/**
 * 서비스 전반에서 공통으로 사용하는 피부 타입 값이다.
 * - 건성, 지성, 복합성, 수부지
 * - 소문자로 저장하는 이유: @Enumerated(EnumType.STRING) 저장값을 그대로 맞추기 위해서다.
 */
public enum SkinTypeEnum {
    dry, oily, combination, subuji
}

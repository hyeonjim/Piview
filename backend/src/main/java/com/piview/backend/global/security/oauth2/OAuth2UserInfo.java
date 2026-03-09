package com.piview.backend.global.security.oauth2;

import java.util.Map;

public abstract class OAuth2UserInfo {
    protected Map<String, Object> attributes;

    public OAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public Map<String, Object> getAttributes() {
        return attributes;
    }

    // 각 소셜 제공자마다 필드 이름이 다르므로 자식 클래스에서 구현하도록 강제
    public abstract String getId();
    public abstract String getName();
    public abstract String getEmail();
}

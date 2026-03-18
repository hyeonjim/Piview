package com.piview.backend.user.profile.dto.request;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;

import lombok.Getter;

@Getter
public class UserProfileUpdateRequest {

    private String name;
    private String gender;
    private String ageGroup;
    private String mySkinType;
    private List<String> skinProblems;

    @JsonIgnore
    private boolean namePresent;

    @JsonIgnore
    private boolean genderPresent;

    @JsonIgnore
    private boolean ageGroupPresent;

    @JsonIgnore
    private boolean mySkinTypePresent;

    @JsonIgnore
    private boolean skinProblemsPresent;

    @JsonIgnore
    private final Map<String, Object> unknownFields = new LinkedHashMap<>();

    @JsonSetter("name")
    public void setName(String name) {
        // PATCH는 "필드가 없으면 유지" 규칙이라, 값 자체보다 필드 존재 여부를 함께 추적한다.
        this.namePresent = true;
        this.name = name;
    }

    @JsonSetter("gender")
    public void setGender(String gender) {
        this.genderPresent = true;
        this.gender = gender;
    }

    @JsonSetter("ageGroup")
    public void setAgeGroup(String ageGroup) {
        this.ageGroupPresent = true;
        this.ageGroup = ageGroup;
    }

    @JsonSetter("mySkinType")
    public void setMySkinType(String mySkinType) {
        this.mySkinTypePresent = true;
        this.mySkinType = mySkinType;
    }

    @JsonSetter("skinProblems")
    public void setSkinProblems(List<String> skinProblems) {
        this.skinProblemsPresent = true;
        this.skinProblems = skinProblems;
    }

    @JsonAnySetter
    public void captureUnknownField(String fieldName, Object value) {
        // 허용하지 않은 필드가 들어오면 서비스에서 INVALID_USER_PROFILE_REQUEST로 막는다.
        unknownFields.put(fieldName, value);
    }
}

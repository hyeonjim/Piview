package com.piview.backend.domain.user.profile.dto.request;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

import lombok.Getter;

@Getter
@Schema(
    description = "내 정보 수정 요청 DTO입니다. 요청에 포함된 필드만 수정하며, 포함되지 않은 필드는 기존 값을 유지합니다."
)
public class UserProfileUpdateRequest {

    @Schema(
        description = "수정할 사용자 표시 이름입니다. 필드를 보내면 반드시 비어 있지 않은 문자열이어야 합니다.",
        example = "김준"
    )
    private String name;

    @Schema(
        description = "수정할 성별입니다. 필드를 보내면 `MEN` 또는 `WOMEN`만 허용합니다. 필드를 생략하면 기존 값을 유지합니다.",
        allowableValues = {"MEN", "WOMEN"},
        example = "WOMEN"
    )
    private String gender;

    @Schema(
        description = "수정할 연령대입니다. 필드를 보내면 허용된 enum 값만 사용할 수 있습니다. 필드를 생략하면 기존 값을 유지합니다.",
        allowableValues = {"TEENS", "TWENTIES", "THIRTIES", "FORTIES_PLUS"},
        example = "TWENTIES"
    )
    private String ageGroup;

    @Schema(
        description = "수정할 피부타입입니다. 필드를 보내면 허용된 enum 값만 사용할 수 있습니다. 필드를 생략하면 기존 값을 유지합니다.",
        allowableValues = {"dry", "oily", "combination", "subuji"},
        example = "subuji"
    )
    private String mySkinType;

    @ArraySchema(
        schema = @Schema(
            description = "피부 고민 항목입니다. 설문 선택 문구(`홍조`, `속건조`, `기미/주근깨/잡티`)와 현재 프로필 조회 응답에서 받은 값(`진정`, `수분`, `색소침착`)을 모두 보낼 수 있습니다. 필드를 생략하면 기존 목록을 유지하고, 빈 배열 `[]`을 보내면 전체 삭제합니다. `null`은 허용하지 않습니다.",
            example = "홍조"
        ),
        arraySchema = @Schema(
            description = "피부 고민 전체 교체 목록",
            example = "[\"홍조\", \"피지\"]"
        )
    )
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

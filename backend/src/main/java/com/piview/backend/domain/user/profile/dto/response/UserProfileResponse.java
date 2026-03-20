package com.piview.backend.domain.user.profile.dto.response;

import java.util.List;

import com.piview.backend.domain.skin.survey.entity.SurveyAgeGroup;
import com.piview.backend.domain.skin.survey.entity.SurveyGender;
import com.piview.backend.domain.skin.survey.entity.SurveySkinType;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "마이페이지 내 정보 조회/수정 응답 DTO입니다.")
public class UserProfileResponse {

    @Schema(description = "사용자 표시 이름", example = "김준")
    private String name;

    @Schema(description = "카카오 계정 이메일입니다. 조회만 가능하고 수정은 지원하지 않습니다.", example = "test@example.com")
    private String email;

    // OAuth 로그인 시 User.imageUrl에 저장한 카카오 프로필 이미지를 마이페이지 GET에도 그대로 노출한다.
    @Schema(
        description = "카카오 프로필 이미지 URL입니다. 설정되지 않았다면 null일 수 있습니다.",
        nullable = true,
        example = "http://k.kakaocdn.net/dn/profile.jpg"
    )
    private String imageUrl;

    @Schema(
        description = "현재 저장된 성별입니다. 아직 설정되지 않았다면 null일 수 있습니다.",
        nullable = true,
        example = "WOMEN"
    )
    private SurveyGender gender;

    @Schema(
        description = "현재 저장된 연령대입니다. 아직 설정되지 않았다면 null일 수 있습니다.",
        nullable = true,
        example = "TWENTIES"
    )
    private SurveyAgeGroup ageGroup;

    @Schema(
        description = "현재 저장된 피부타입입니다. 아직 설정되지 않았다면 null일 수 있습니다.",
        nullable = true,
        example = "DEHYDRATED_OILY"
    )
    private SurveySkinType mySkinType;

    @ArraySchema(
        schema = @Schema(description = "현재 설정된 피부 고민 항목입니다.", example = "수분"),
        arraySchema = @Schema(description = "현재 저장된 피부 고민 목록입니다. 값이 없다면 빈 배열로 응답합니다.", example = "[\"수분\", \"진정\", \"피지\"]")
    )
    private List<String> skinProblems;
}

package com.piview.backend.domain.skin.survey.dto.request;

import java.util.List;

import com.piview.backend.domain.skin.survey.entity.SurveyAgeGroup;
import com.piview.backend.domain.skin.survey.entity.SurveyChoice;
import com.piview.backend.domain.skin.survey.entity.SurveyGender;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Schema(description = "최종 피부 설문 제출 요청 DTO입니다. gender, ageGroup, Q3~Q6 응답, 피부 고민 목록(Q7)을 함께 전송합니다.")
public class SurveySubmitRequest {

    @NotNull
    @Schema(description = "설문 응답자의 성별입니다.", example = "WOMEN")
    private SurveyGender gender;

    @NotNull
    @Schema(description = "설문 응답자의 연령대입니다. 40대 이상은 최종 피부 고민에 `안티에이징` 태그가 파생 추가될 수 있습니다.", example = "TWENTIES")
    private SurveyAgeGroup ageGroup;

    // Q3~Q6은 설문 명세에 따라 A/B/C/D 고정 선택값을 사용한다.
    @NotNull
    @Schema(
        description = "문항 3 응답입니다. `세안한 뒤 아무것도 바르지 않고 10~20분 정도 지나면, 피부는 보통 어떤 느낌에 가장 가깝나요?` A=얼굴 전체가 당기고 메마른 느낌, B=비교적 편안함, C=볼이나 턱이 먼저 당기거나 거칠게 느껴짐, D=겉은 괜찮아 보여도 안쪽이 당기거나 건조함",
        example = "D"
    )
    private SurveyChoice question3;

    @NotNull
    @Schema(
        description = "문항 4 응답입니다. `오후쯤 거울을 봤을 때, 얼굴은 보통 어떻게 보이나요?` A=얼굴 전체가 푸석하거나 건조함, B=전체적으로 무난함, C=이마와 코는 번들거리는데 볼과 턱은 덜 번들거림, D=얼굴 전체가 전반적으로 번들거림",
        example = "C"
    )
    private SurveyChoice question4;

    @NotNull
    @Schema(
        description = "문항 5 응답입니다. `얼굴 겉은 번들거리는데, 피부 안쪽은 당기거나 메마르게 느껴질 때가 있나요?` A=자주 그렇다, B=가끔 그렇다, C=거의 그렇지 않다, D=잘 모르겠다",
        example = "A"
    )
    private SurveyChoice question5;

    @NotNull
    @Schema(
        description = "문항 6 응답입니다. `맨얼굴을 봤을 때, 피지나 모공이 특히 눈에 띄는 부위는 어디인가요?` A=거의 없다, B=얼굴 여러 부위에서 비슷하다, C=주로 코나 이마 쪽에서 더 눈에 띈다, D=코 주변은 눈에 띄지만 볼이나 턱은 상대적으로 덜 눈에 띈다",
        example = "C"
    )
    private SurveyChoice question6;

    // Q7은 다중 선택 문항이다.
    @NotEmpty
    @ArraySchema(
        minItems = 1,
        schema = @Schema(
            description = "문항 7 피부 고민 항목입니다. 설문 원문 보기 값을 그대로 보냅니다.",
            allowableValues = {"여드름", "미백", "기미/주근깨/잡티", "주름/탄력", "피지", "블랙헤드", "속건조", "홍조", "각질"},
            example = "홍조"
        ),
        arraySchema = @Schema(
            description = "문항 7 다중 선택 목록입니다. 최소 1개 이상 선택해야 합니다.",
            example = "[\"홍조\", \"속건조\", \"피지\"]"
        )
    )
    private List<String> skinProblems;
}

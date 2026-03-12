package com.piview.backend.skin.survey.service;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.piview.backend.skin.survey.entity.SurveyChoice;
import com.piview.backend.skin.survey.entity.SurveySkinType;

@Component
public class SurveyScoreCalculator {

    // 문항 3~6 응답으로 최종 피부 타입을 계산하는 진입 함수다.
    public SurveySkinType calculateSkinType(
        SurveyChoice question3,
        SurveyChoice question4,
        SurveyChoice question5,
        SurveyChoice question6
    ) {
        // 1) 입력 검증: Q3~Q6 중 하나라도 비어 있으면 계산을 중단한다.
        validateQuestions(question3, question4, question5, question6);

        // 2) 점수판 초기화: 피부 타입별 누적 점수를 저장한다.
        // 예) DRY=0, OILY=0, COMBINATION=0, DEHYDRATED_OILY=0
        Map<SurveySkinType, Integer> scoreMap = new EnumMap<>(SurveySkinType.class);
        for (SurveySkinType type : SurveySkinType.values()) {
            scoreMap.put(type, 0);
        }

        // 3) Q3~Q6 응답을 타입 점수로 누적한다.
        // increaseScore는 선택지(A/B/C/D)를 타입으로 매핑한 뒤 해당 타입 점수를 +1 한다.
        increaseScore(scoreMap, question3);
        increaseScore(scoreMap, question4);
        increaseScore(scoreMap, question5);
        increaseScore(scoreMap, question6);

        // 4) 가장 높은 점수(maxScore)를 찾는다.
        int maxScore = scoreMap.values().stream()
            .mapToInt(Integer::intValue)
            .max()
            .orElseThrow(() -> new IllegalStateException("피부 타입 점수 계산에 실패했습니다."));

        // 5) 최고점과 같은 점수를 가진 피부 타입 목록을 모은다.
        List<SurveySkinType> tiedTypes = new ArrayList<>();
        for (Map.Entry<SurveySkinType, Integer> entry : scoreMap.entrySet()) {
            if (entry.getValue() == maxScore) {
                tiedTypes.add(entry.getKey());
            }
        }

        // 6) 최고점 타입이 1개면 그대로 결과로 반환한다.
        if (tiedTypes.size() == 1) {
            return tiedTypes.getFirst();
        }

        // 7) 동점이면 문서 규칙대로 Q5 -> Q4 -> Q3 순으로 우선 판정한다.
        return resolveTie(tiedTypes, question5, question4, question3);
    }

    // 계산 전에 필수 문항 누락 여부를 검증한다.
    private void validateQuestions(
        SurveyChoice question3,
        SurveyChoice question4,
        SurveyChoice question5,
        SurveyChoice question6
    ) {
        if (question3 == null || question4 == null || question5 == null || question6 == null) {
            throw new IllegalArgumentException("문항 3~6의 응답은 모두 필수입니다.");
        }
    }

    // 한 문항의 선택지를 피부 타입으로 매핑해 점수를 1 증가시킨다.
    private void increaseScore(Map<SurveySkinType, Integer> scoreMap, SurveyChoice questionChoice) {
        // 예) questionChoice=B 이면 COMBINATION 점수를 +1
        SurveySkinType mappedType = mapChoiceToSkinType(questionChoice);
        scoreMap.put(mappedType, scoreMap.get(mappedType) + 1);
    }

    // 동점 집합에서 문항 5 -> 4 -> 3 우선순위 규칙으로 최종 타입을 고른다.
    private SurveySkinType resolveTie(
        List<SurveySkinType> tiedTypes,
        SurveyChoice question5,
        SurveyChoice question4,
        SurveyChoice question3
    ) {
        // tieSet: 동점인 타입만 빠르게 포함 검사하기 위한 집합
        EnumSet<SurveySkinType> tieSet = EnumSet.copyOf(tiedTypes);
        // tieBreakOrder: 문서에 정의된 동점 우선순위(Q5 -> Q4 -> Q3)
        List<SurveyChoice> tieBreakOrder = List.of(question5, question4, question3);

        // 타이브레이커 문항의 선택지로 매핑된 타입이 동점 집합에 있으면 즉시 채택한다.
        for (SurveyChoice choice : tieBreakOrder) {
            SurveySkinType candidate = mapChoiceToSkinType(choice);
            if (tieSet.contains(candidate)) {
                return candidate;
            }
        }

        return tiedTypes.getFirst();
    }

    // 설문 선택지(A/B/C/D)를 도메인 피부 타입으로 변환한다.
    private SurveySkinType mapChoiceToSkinType(SurveyChoice choice) {
        // 문항 3~6의 모든 선택지는 동일한 매핑 규칙을 사용한다.
        return switch (choice) {
            case A -> SurveySkinType.DRY;
            case B -> SurveySkinType.COMBINATION;
            case C -> SurveySkinType.OILY;
            case D -> SurveySkinType.DEHYDRATED_OILY;
        };
    }
}

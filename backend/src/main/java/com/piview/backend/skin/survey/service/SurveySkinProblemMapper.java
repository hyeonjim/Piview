package com.piview.backend.skin.survey.service;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;

@Component
public class SurveySkinProblemMapper {

    // 프론트는 설문 문구를 보내고, 백엔드는 추천/필터에 쓸 내부 태그로 바꿔 저장한다.
    // 문구가 바뀌더라도 내부 태그 기준은 유지할 수 있게 매핑 테이블로 분리한다.
    private static final Map<String, List<String>> SKIN_PROBLEM_TAG_MAPPINGS = createMappings();

    public List<String> mapToTags(List<String> skinProblems) {
        // 입력 순서는 유지하면서, 여러 보기에서 같은 태그가 나오면 한 번만 저장한다.
        LinkedHashSet<String> mappedTags = new LinkedHashSet<>();

        for (String skinProblem : skinProblems) {
            String normalizedProblem = normalizeSkinProblem(skinProblem);
            List<String> tags = SKIN_PROBLEM_TAG_MAPPINGS.get(normalizedProblem);

            if (tags == null) {
                // Q7은 허용된 보기만 받는다. 문서에 없는 자유 입력은 요청 오류로 본다.
                throw new CustomException(ErrorCode.INVALID_REQUEST);
            }

            mappedTags.addAll(tags);
        }

        return List.copyOf(mappedTags);
    }

    private String normalizeSkinProblem(String skinProblem) {
        if (skinProblem == null) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        String normalizedProblem = skinProblem.trim();

        if (normalizedProblem.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        return normalizedProblem;
    }

    private static Map<String, List<String>> createMappings() {
        Map<String, List<String>> mappings = new LinkedHashMap<>();

        // 1:1 매핑 케이스
        mappings.put("아토피", List.of("아토피"));
        mappings.put("여드름", List.of("여드름"));
        mappings.put("미백", List.of("미백"));
        mappings.put("피지", List.of("피지"));
        mappings.put("블랙헤드", List.of("블랙헤드"));
        mappings.put("기미/주근깨/잡티", List.of("색소침착"));
        mappings.put("속건조", List.of("수분"));
        mappings.put("주름/탄력", List.of("안티에이징"));

        // 1:N 매핑 케이스. 한 설문 보기가 여러 추천 태그로 확장될 수 있다.
        mappings.put("홍조", List.of("홍조", "진정"));
        mappings.put("각질", List.of("수분", "영양"));

        return Map.copyOf(mappings);
    }
}

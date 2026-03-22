package com.piview.backend.domain.user.profile.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.domain.skin.common.SkinTypeEnum;
import com.piview.backend.domain.skin.survey.entity.MySkin;
import com.piview.backend.domain.skin.survey.entity.SurveyAgeGroup;
import com.piview.backend.domain.skin.survey.entity.SurveyGender;
import com.piview.backend.domain.skin.survey.repository.MySkinRepository;
import com.piview.backend.domain.user.login.entity.User;
import com.piview.backend.domain.user.profile.dto.request.UserProfileUpdateRequest;
import com.piview.backend.domain.user.profile.dto.response.UserProfileResponse;
import com.piview.backend.domain.user.login.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    // GET 응답이 저장 태그를 그대로 내리므로, PATCH에서도 저장 태그와 설문 문구 둘 다 허용한다.
    private static final Map<String, List<String>> SKIN_PROBLEM_MAPPINGS = createSkinProblemMappings();

    private final UserRepository userRepository;
    private final MySkinRepository mySkinRepository;

    @Transactional(readOnly = true)
    // 마이페이지 GET 로직이다. User 기본 정보와 MySkin 태그를 합쳐 응답 DTO를 만든다.
    public UserProfileResponse getMyProfile(Long userId) {
        User user = findUser(userId);
        return buildResponse(user, mySkinRepository.findAllByUserId(userId));
    }

    @Transactional
    // 마이페이지 PATCH 로직이다. 요청에 포함된 필드만 부분 수정하고 응답은 최신 상태로 다시 조립한다.
    public UserProfileResponse updateMyProfile(Long userId, UserProfileUpdateRequest request) {
        if (request == null) {
            throw new CustomException(ErrorCode.INVALID_USER_PROFILE_REQUEST);
        }
        // 부분 수정 계약을 단순하게 유지하기 위해 정의되지 않은 필드는 바로 요청 오류로 처리한다.
        if (!request.getUnknownFields().isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_USER_PROFILE_REQUEST);
        }

        User user = findUser(userId);

        if (request.isNamePresent()) {
            user.setName(readValidatedName(request.getName()));
        }
        if (request.isGenderPresent()) {
            user.setGender(parseEnum(request.getGender(), SurveyGender.class, ErrorCode.INVALID_GENDER));
        }
        if (request.isAgeGroupPresent()) {
            user.setAgeGroup(parseEnum(request.getAgeGroup(), SurveyAgeGroup.class, ErrorCode.INVALID_AGE_GROUP));
        }
        if (request.isMySkinTypePresent()) {
            user.setMySkinType(parseSkinType(request.getMySkinType()));
        }
        if (request.isSkinProblemsPresent()) {
            List<String> skinProblems = readSkinProblems(request.getSkinProblems());
            // skinProblems는 부분 병합이 아니라 "필드가 오면 전체 교체" 규칙을 따른다.
            mySkinRepository.deleteAllByUserId(userId);
            if (!skinProblems.isEmpty()) {
                mySkinRepository.saveAll(createMySkins(userId, skinProblems));
            }
        }

        return buildResponse(user, mySkinRepository.findAllByUserId(userId));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    // 마이페이지 응답 조립 로직이다. User와 MySkin을 UserProfileResponse 하나로 합친다.
    private UserProfileResponse buildResponse(User user, List<MySkin> mySkins) {
        return UserProfileResponse.builder()
            .name(user.getName())
            .email(user.getEmail())
            // 카카오 로그인에서 저장한 imageUrl을 마이페이지 조회 응답에 그대로 포함한다.
            .imageUrl(user.getImageUrl())
            .gender(user.getGender())
            .ageGroup(user.getAgeGroup())
            .mySkinType(user.getMySkinType())
            // skinProblems는 설문 원문이 아니라 현재 DB에 저장된 내부 태그 목록을 그대로 내려준다.
            .skinProblems(mySkins.stream().map(MySkin::getSkinProblem).toList())
            .build();
    }

    private String readValidatedName(String name) {
        if (name == null || name.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_USER_NAME);
        }

        return name.trim();
    }

    private List<String> readSkinProblems(List<String> skinProblems) {
        if (skinProblems == null) {
            throw new CustomException(ErrorCode.INVALID_SKIN_PROBLEMS);
        }

        List<String> normalizedSelections = new ArrayList<>();
        for (String skinProblem : skinProblems) {
            if (skinProblem == null || skinProblem.isBlank()) {
                throw new CustomException(ErrorCode.INVALID_SKIN_PROBLEMS);
            }
            normalizedSelections.add(skinProblem.trim());
        }

        return mapSkinProblems(normalizedSelections);
    }

    private List<String> mapSkinProblems(List<String> skinProblems) {
        LinkedHashSet<String> mapped = new LinkedHashSet<>();

        for (String skinProblem : skinProblems) {
            List<String> mappedTags = SKIN_PROBLEM_MAPPINGS.get(skinProblem);
            if (mappedTags == null) {
                throw new CustomException(ErrorCode.INVALID_SKIN_PROBLEMS);
            }
            mapped.addAll(mappedTags);
        }

        return List.copyOf(mapped);
    }

    private List<MySkin> createMySkins(Long userId, List<String> skinProblems) {
        return skinProblems.stream()
            .map(skinProblem -> MySkin.builder()
                .userId(userId)
                .skinProblem(skinProblem)
                .build())
            .toList();
    }

    private <T extends Enum<T>> T parseEnum(String value, Class<T> enumType, ErrorCode errorCode) {
        if (value == null || value.isBlank()) {
            throw new CustomException(errorCode);
        }

        try {
            return Enum.valueOf(enumType, value.trim());
        } catch (IllegalArgumentException exception) {
            throw new CustomException(errorCode);
        }
    }

    private SkinTypeEnum parseSkinType(String value) {
        if (value == null || value.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_MY_SKIN_TYPE);
        }

        try {
            return SkinTypeEnum.valueOf(value.trim());
        } catch (IllegalArgumentException exception) {
            throw new CustomException(ErrorCode.INVALID_MY_SKIN_TYPE);
        }
    }

    private static Map<String, List<String>> createSkinProblemMappings() {
        Map<String, List<String>> mappings = new LinkedHashMap<>();

        // 왼쪽은 프론트 입력값, 오른쪽은 DB에 저장할 내부 태그다.
        mappings.put("여드름", List.of("여드름"));
        mappings.put("미백", List.of("미백"));
        mappings.put("기미/주근깨/잡티", List.of("색소침착"));
        mappings.put("주름/탄력", List.of("안티에이징"));
        mappings.put("피지", List.of("피지"));
        mappings.put("블랙헤드", List.of("블랙헤드"));
        mappings.put("속건조", List.of("수분"));
        mappings.put("홍조", List.of("진정"));
        mappings.put("각질", List.of("각질"));

        // GET 응답을 그대로 PATCH에 다시 보내도 깨지지 않도록 저장 태그도 허용한다.
        mappings.put("색소침착", List.of("색소침착"));
        mappings.put("안티에이징", List.of("안티에이징"));
        mappings.put("수분", List.of("수분"));
        mappings.put("진정", List.of("진정"));

        return Map.copyOf(mappings);
    }
}

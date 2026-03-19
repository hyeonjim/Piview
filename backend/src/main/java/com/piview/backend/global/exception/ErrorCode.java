package com.piview.backend.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 400 BAD_REQUEST
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."),
    INVALID_IMAGE_FILE(HttpStatus.BAD_REQUEST, "이미지 파일이 비어있거나 손상되었습니다."),
    INVALID_USER_PROFILE_REQUEST(HttpStatus.BAD_REQUEST, "내 정보 수정 요청 형식이 올바르지 않습니다."),
    INVALID_USER_NAME(HttpStatus.BAD_REQUEST, "이름은 비워둘 수 없습니다."),
    INVALID_GENDER(HttpStatus.BAD_REQUEST, "성별 값이 올바르지 않습니다."),
    INVALID_AGE_GROUP(HttpStatus.BAD_REQUEST, "연령대 값이 올바르지 않습니다."),
    INVALID_MY_SKIN_TYPE(HttpStatus.BAD_REQUEST, "피부타입 값이 올바르지 않습니다."),
    INVALID_SKIN_PROBLEMS(HttpStatus.BAD_REQUEST, "피부 고민 목록 값이 올바르지 않습니다."),

    // 403 FORBIDDEN
    UNAUTHORIZED_ACCESS(HttpStatus.FORBIDDEN, "본인의 화장품 목록만 접근 및 삭제할 수 있습니다."),
    SKIN_ANALYSIS_ACCESS_DENIED(HttpStatus.FORBIDDEN, "본인의 피부 분석만 확인할 수 있습니다."),

    // 404 NOT_FOUND
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 사용자를 찾을 수 없습니다."),
    COSMETICS_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 상품을 찾을 수 없습니다."),
    DISLIKED_PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "안 맞는 제품 목록에서 해당 상품을 찾을 수 없습니다."),
    OCR_TEXT_NOT_FOUND(HttpStatus.NOT_FOUND, "이미지에서 화장품 관련 텍스트를 찾을 수 없습니다."),
    MY_COS_NOT_FOUND(HttpStatus.NOT_FOUND, "보관함에서 해당 화장품을 찾을 수 없습니다."),
    SKIN_ANALYSIS_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 피부 분석 결과를 찾을 수 없습니다."),

    // 409 CONFLICT
    ALREADY_SAVED_PRODUCT(HttpStatus.CONFLICT, "이미 보관함에 존재하는 상품입니다."),
    ALREADY_DISLIKED_PRODUCT(HttpStatus.CONFLICT, "이미 안 맞는 제품으로 등록된 상품입니다."),
    SKIN_ANALYSIS_NOT_COMPLETED(HttpStatus.CONFLICT, "피부 분석이 아직 완료되지 않았습니다. 잠시 후 다시 시도해주세요."),
    SKIN_ANALYSIS_FAILED(HttpStatus.CONFLICT, "피부 분석에 실패했습니다. 다시 촬영한 뒤 시도해주세요."),
    SKIN_ANALYSIS_ALREADY_CONSUMED(HttpStatus.CONFLICT, "이미 최종 제출이 완료된 분석입니다."),
    SKIN_SURVEY_SUBMIT_IN_PROGRESS(HttpStatus.CONFLICT, "이미 처리 중인 요청입니다. 잠시 후 다시 시도해주세요."),

    // 503 SERVICE_UNAVAILABLE
    AI_SERVER_TIMEOUT(HttpStatus.SERVICE_UNAVAILABLE, "AI 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요."),

    // 500 INTERNAL_SERVER_ERROR
    AI_TEXT_EXTRACTION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "AI 서버에서 텍스트 추출에 실패했습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다."),

    // S3 업로드 오류
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드 과정에서 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String message;
}

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

    // 403 FORBIDDEN
    UNAUTHORIZED_ACCESS(HttpStatus.FORBIDDEN, "본인의 화장품 목록만 접근 및 삭제할 수 있습니다."),

    // 404 NOT_FOUND
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 사용자를 찾을 수 없습니다."),
    COSMETICS_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 상품을 찾을 수 없습니다."),
    OCR_TEXT_NOT_FOUND(HttpStatus.NOT_FOUND, "이미지에서 화장품 관련 텍스트를 찾을 수 없습니다."),

    // 409 CONFLICT
    ALREADY_SAVED_PRODUCT(HttpStatus.CONFLICT, "이미 보관함에 존재하는 상품입니다."),

    // 503 SERVICE_UNAVAILABLE
    AI_SERVER_TIMEOUT(HttpStatus.SERVICE_UNAVAILABLE, "AI 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요."),

    // 500 INTERNAL_SERVER_ERROR
    AI_TEXT_EXTRACTION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "AI 서버에서 텍스트 추출에 실패했습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String message;
}

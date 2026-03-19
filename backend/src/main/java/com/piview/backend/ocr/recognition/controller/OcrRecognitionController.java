package com.piview.backend.ocr.recognition.controller;


import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.ocr.recognition.dto.OcrRecognitionResponseDto;
import com.piview.backend.ocr.recognition.service.OcrRecognitionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "OCR 화장품 인식 API", description = "이미지를 업로드하여 화장품 텍스트 및 정보를 인식하는 API")
@RestController
@RequestMapping("/ocr")
@RequiredArgsConstructor
public class OcrRecognitionController {

    private final OcrRecognitionService ocrRecognitionService;

    @Operation(summary = "제품 이미지 인식", description = "이미지 파일(MultipartFile)을 업로드받아 OCR 분석을 수행하고 결과를 반환합니다.")
    @PostMapping(value = "/recognize", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<OcrRecognitionResponseDto> recognizeCosmetic(
            @RequestParam("image") MultipartFile image) {

        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("❌ 인식할 화장품 이미지가 필요합니다.");
        }

        OcrRecognitionResponseDto responseDto = ocrRecognitionService.processImageRecognition(image);

        return ApiResponse.success(responseDto);
    }
}
package com.piview.backend.ocr.recognition.controller;


import com.piview.backend.ocr.recognition.dto.OcrRecognitionResponseDto;
import com.piview.backend.ocr.recognition.service.OcrRecognitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/ocr")
@RequiredArgsConstructor
public class OcrRecognitionController {

    private final OcrRecognitionService ocrRecognitionService;

    @PostMapping(value = "/recognize", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OcrRecognitionResponseDto> recognizeCosmetic(
            @RequestParam("image") MultipartFile image) {

        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("❌ 인식할 화장품 이미지가 필요합니다.");
        }

        OcrRecognitionResponseDto responseDto = ocrRecognitionService.processImageRecognition(image);
        return ResponseEntity.ok(responseDto);
    }
}
package com.piview.backend.domain.product.s3.controller;

import com.piview.backend.global.exception.ApiResponse;
import com.piview.backend.domain.product.s3.dto.S3UploadResponseDto;
import com.piview.backend.domain.product.s3.service.S3UploadService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "S3 Upload API", description = "AWS S3 이미지 업로드 API")
@RestController
@RequestMapping("/s3")
public class S3UploadController {

    private final S3UploadService s3UploadService;

    public S3UploadController(S3UploadService s3UploadService) {
        this.s3UploadService = s3UploadService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<S3UploadResponseDto> uploadFiles(@RequestPart("files") List<MultipartFile> files) {
        List<String> uploadedUrls = s3UploadService.uploadFiles(files);
        S3UploadResponseDto responseDto = new S3UploadResponseDto(uploadedUrls);

        // 🌟 규칙 1 적용: 성공 시 ApiResponse.success() 안에 DTO를 쏙 넣어서 반환!
        return ApiResponse.success(responseDto);
    }

}

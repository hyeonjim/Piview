package com.piview.backend.product.s3.service;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import io.awspring.cloud.s3.S3Template;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class S3UploadService {

    private final S3Template s3Template;

    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucketName;

    public S3UploadService(S3Template s3Template) {
        this.s3Template = s3Template;
    }

    public List<String> uploadFiles(List<MultipartFile> files) {
        List<String> imageUrls = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;

            try {
                String originalFilename = file.getOriginalFilename();
                String s3FileName = UUID.randomUUID().toString().substring(0, 10) + "_" + originalFilename;

                s3Template.upload(bucketName, s3FileName, file.getInputStream());

                String url = "https://" + bucketName + ".s3.ap-northeast-2.amazonaws.com/" + s3FileName;
                imageUrls.add(url);

            } catch (IOException e) {
                // 🌟 규칙 2 적용: 지저분한 에러 대신 CustomException을 던집니다!
                throw new CustomException(ErrorCode.FILE_UPLOAD_FAILED);
            }
        }

        return imageUrls;
    }
}

package com.piview.backend.skin.analysis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Component
public class SkinAnalysisAiClient {

    @Value("${fastapi.base-url}")
    private String fastApiBaseUrl;

    // 피부 분석은 OCR와 같은 방식으로 multipart 요청을 보내고, AI 응답 본문은 그대로 JsonNode로 받습니다.
    public JsonNode requestSkinAnalysis(byte[] imageBytes, String fileName) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", createImageResource(imageBytes, fileName));

        JsonNode response = buildRestClient().post()
                .uri(fastApiBaseUrl + "/skin/predict")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        if (response == null) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
        return response;
    }

    // 디스크에 임시 파일을 만들지 않고 메모리의 바이트 배열을 바로 업로드 리소스로 감쌉니다.
    private ByteArrayResource createImageResource(byte[] imageBytes, String fileName) {
        return new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };
    }

    // connect timeout은 짧게, read timeout은 AI 추론 시간을 고려해 조금 더 길게 둡니다.
    private RestClient buildRestClient() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(3000);
        requestFactory.setReadTimeout(20000);

        return RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }
}

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

    // FastAPI /skin/predict 에 multipart/form-data 형태로 이미지를 전달합니다.
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

    // 디스크에 임시 저장하지 않고 메모리에서 바로 multipart 리소스를 만듭니다.
    private ByteArrayResource createImageResource(byte[] imageBytes, String fileName) {
        return new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };
    }

    private RestClient buildRestClient() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(3000);
        requestFactory.setReadTimeout(20000);

        return RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }
}

package com.piview.backend.domain.routine.analysis.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.piview.backend.domain.routine.analysis.dto.response.RoutineAnalysisResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class RoutineAnalysisAiClient {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String API_URL =
            "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public CompletableFuture<RoutineAnalysisResponse> analyzeRoutineAsync(String routineContext) {
        try {
            String systemPrompt = """
                    너는 뷰티 앱 '피뷰(FiView)'의 스킨케어 분석 AI야.
                    반드시 제공된 데이터만 근거로 분석하고, 데이터에 없는 내용은 절대 추측하거나 지어내지 마.
                    
                    [절대 금지 사항]
                    - "성분 정보 없음 (성분 관련 언급 금지)" 제품의 성분 효능 언급 금지
                    - "이상치 비교 불가" 제품의 수분/유분 비교 언급 금지
                    - 점수, 수치, 기준값 등 숫자를 답변에 직접 언급 금지
                    - 제공된 데이터 외의 정보로 효능 추측 금지
                    - 데이터가 "❌"인데 좋다고 말하는 것 금지
                    - 충돌주의성분이 "없음"이면 성분 충돌 언급 금지
                    
                    [작성 규칙]
                    1. 반드시 아래 JSON 형식으로만 출력할 것.
                    2. analysisText는 5줄 이내, 각 줄은 실제 줄바꿈(\\n)으로 구분할 것.
                    3. 각 문장 시작에 어울리는 이모지 1개씩 넣을 것.
                    4. 금지어: "민감성" → "예민해진 피부"로 대체.
                    5. 피부타입이 "❌ 맞지 않는 제품"이면 "건성 피부에 맞지 않는 제품이에요" 형식으로 경고할 것.
                    6. 수분/유분이 "부족 ⚠️"이면 해당 단계에서 보완이 필요하다고 말하고 추천 후보가 있으면 제품명 언급할 것.
                    7. 보완 추천 후보가 있으면 실제 제품명(브랜드 포함)을 직접 언급하며 추천할 것.
                    8. 모든 데이터가 양호(✅)하면 "건성 피부에 잘 맞는 제품들로 구성된 루틴이에요" 형식으로 칭찬할 것.
                    
                    [출력 JSON 포맷]
                    {
                      "analysisText": "첫번째 줄\\n두번째 줄\\n세번째 줄"
                    }
                    """;

            Map<String, Object> requestBodyMap = Map.of(
                    "systemInstruction", Map.of("parts", new Object[]{Map.of("text", systemPrompt)}),
                    "contents", new Object[]{
                            Map.of("role", "user", "parts", new Object[]{Map.of("text", routineContext)})
                    },
                    "generationConfig", Map.of(
                            "responseMimeType", "application/json",
                            "temperature", 0.3
                    )
            );

            String requestBody = objectMapper.writeValueAsString(requestBodyMap);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                    .thenApply(response -> {
                        if (response.statusCode() != 200) {
                            throw new RuntimeException("API 응답 에러: " + response.body());
                        }
                        try {
                            var rootNode = objectMapper.readTree(response.body());
                            String contentJson = rootNode.path("candidates").get(0)
                                    .path("content").path("parts").get(0).path("text").asText();

                            if (contentJson.startsWith("```json")) {
                                contentJson = contentJson.replace("```json", "").replace("```", "").trim();
                            } else if (contentJson.startsWith("```")) {
                                contentJson = contentJson.replace("```", "").trim();
                            }

                            return objectMapper.readValue(contentJson, RoutineAnalysisResponse.class);
                        } catch (Exception e) {
                            throw new RuntimeException("JSON 파싱 에러", e);
                        }
                    })
                    .exceptionally(ex -> {
                        System.err.println("루틴 분석 중 오류: " + ex.getMessage());
                        return new RoutineAnalysisResponse(
                                "💧 루틴 분석을 불러오는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요."
                        );
                    });

        } catch (Exception e) {
            return CompletableFuture.failedFuture(e);
        }
    }
}

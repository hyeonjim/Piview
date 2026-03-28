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
                    너는 뷰티 앱 '피뷰(FiView)'의 전문 스킨케어 에디터 AI야.
                    사용자의 피부 타입, 고민, 현재 루틴 구성(제품명, 카테고리, 성분, 이상치)을 바탕으로
                    루틴 전체에 대한 분석과 조언을 제공해.
                    
                    [용어 정의]
                    - 이상치 수분: 해당 루틴 단계에서 피부 타입에 맞게 공급해야 할 수분(보습)의 이상적인 수치
                    - 이상치 유분: 해당 루틴 단계에서 피부 타입에 맞게 공급해야 할 유분(오일)의 이상적인 수치
                    
                    [작성 규칙]
                    1. 반드시 아래 JSON 형식으로만 출력할 것.
                    2. analysisText는 5줄 이내로 작성하되, 각 줄은 실제 줄바꿈(\\n)으로 구분할 것.
                    3. 다음 내용을 포함할 것:
                       - 현재 루틴 전체에 대한 평가 (1~2줄)
                       - [보완 추천 후보]가 있으면 해당 단계에서 부족한 이유를 간단히 설명하고,
                         후보 제품 중 가장 적합한 것을 실제 제품명(브랜드 포함)으로 구체적으로 추천할 것.
                         절대 성분이나 기능만 언급하지 말고 반드시 제품명을 직접 언급할 것.
                       - [모든 단계가 이상치에 근접합니다]면 추천 없이 칭찬만 할 것.
                       - 성분 충돌 위험이 있다면 구체적으로 어떤 성분끼리 충돌하는지 경고할 것.
                       - 루틴 순서나 사용 팁
                    4. 금지어: "민감성" 사용 금지 (필요시 "예민해진 피부"로 대체)
                    5. 각 문장 시작에 어울리는 이모지 1개씩 넣을 것.
                    
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

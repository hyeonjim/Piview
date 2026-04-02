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
                    어려운 전문 용어는 쓰지 말고 사용자가 이해하기 쉬운 말로 작성해.
                    
                    [절대 금지 사항]
                    - "성분 정보 없음 (성분 관련 언급 금지)" 제품의 성분 효능 언급 금지
                    - 수분·유분을 제품 개별로 평가하는 것 금지 — 반드시 루틴 전체 밸런스로만 평가할 것
                    - 점수·수치·기준값 등 숫자를 답변에 직접 언급 금지
                    - 제공된 데이터 외의 정보로 효능 추측 금지
                    - 데이터가 "❌"인데 좋다고 말하는 것 금지
                    - 충돌주의성분이 "없음"이면 성분 충돌 언급 금지
                    - 고민 케어 제안 시 "부족하다"는 표현 금지 — 반드시 제안·권유 형식으로 말할 것
                    
                    [작성 규칙]
                    1. 반드시 아래 JSON 형식으로만 출력할 것.
                    2. analysisText는 8줄 이내, 각 줄은 실제 줄바꿈(\\n)으로 구분할 것.
                    3. 각 문장 시작에 어울리는 이모지 1개씩 넣을 것.
                    4. 금지어: "민감성" → "예민해진 피부"로 대체.
                    
                    [문장 구성 순서 — 반드시 이 순서로 작성]
                    1번 줄: [피부타입 루틴 가이드]를 참고해 이 피부타입 루틴의 전체 방향·성격을 1줄로 총평.
                        예) "💧 건성 피부에게 수분 공급이 핵심인 루틴이에요."
                    2~6번 줄: 아래 항목 중 해당하는 것만 간결하게 언급 (해당 없으면 생략)
                        - 피부타입 적합도가 "❌"인 제품 경고: "{제품 카테고리} 제품이 {피부타입} 피부에 잘 맞지 않아요" 형식
                        - [루틴 전체 유수분 밸런스]가 "약간 부족 🔶" 또는 "부족 ⚠️"이면 보완 필요 언급
                        - [보완 추천 후보]가 있으면 실제 제품명(브랜드 포함) 직접 언급하며 "~를 추가해보세요" 형식으로 추천
                        - 충돌주의성분이 2개 이상이면 충돌 성분 조합을 경고
                        - 모든 항목이 양호하면 데이터 근거를 들어 구체적으로 칭찬
                    7번 줄 (있을 때만): [추가 고민 케어 제안]이 있으면 "~도 함께 쓰면 더 좋을 것 같아요" 형식으로 부드럽게 제안
                    마지막 줄: 루틴 전체 종합 의견 1줄 — [루틴 전체 유수분 밸런스] 데이터를 근거로 마무리
                        예) "✨ 전체적으로 건성 피부에 잘 맞는 수분 루틴이에요."
                        예) "🔶 토너 단계에서 수분을 보완하면 더 완성도 높은 루틴이 될 거예요."
                    
                    [출력 JSON 포맷]
                    {
                      "analysisText": "첫번째 줄\\n두번째 줄\\n...\\n종합의견 줄"
                    }
                    """;

            Map<String, Object> requestBodyMap = Map.of(
                    "systemInstruction", Map.of("parts", new Object[]{Map.of("text", systemPrompt)}),
                    "contents", new Object[]{
                            Map.of("role", "user", "parts", new Object[]{Map.of("text", routineContext)})
                    },
                    "generationConfig", Map.of(
                            "responseMimeType", "application/json",
                            "temperature", 0.2   // 0.3 → 0.2: 더 일관되게 지시사항 따르도록 낮춤
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

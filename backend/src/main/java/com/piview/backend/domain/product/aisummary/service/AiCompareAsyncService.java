package com.piview.backend.domain.product.aisummary.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.piview.backend.domain.product.aisummary.dto.AiComparisonResponse;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AiCompareAsyncService {

  @Value("${gemini.api.key}")
  private String apiKey;

  private static final String API_URL = "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
  private final ObjectMapper objectMapper = new ObjectMapper();
  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(15))
      .build();

  public CompletableFuture<AiComparisonResponse> compareProductsAsync(String comparisonContext) {

    try {
      String systemPrompt = """
                너는 뷰티 앱 '피뷰(FiView)'의 전문 에디터 AI야.
                사용자의 피부 타입과 고민, 그리고 두 비교 제품의 특징을 분석해서 자연스러운 줄글 형태의 비교 보고서를 작성해.
                
                [작성 규칙]
                1. 반드시 아래의 JSON 형식으로만 출력할 것.
                2. 금지어: "민감성" 이라는 단어는 절대, 네버 사용하지 말 것. (필요하다면 '예민해진 피부' 등으로 대체하거나 아예 생략할 것)
                3. 추천 절대 규칙: [비교 대상 제품]의 '추천 피부 타입' 데이터와 [사용자 피부 정보]의 '피부 타입'이 일치하는 제품을 무조건 최우선으로 추천할 것.
                4. 다음과 같은 흐름으로 3~4문장 분량의 자연스러운 줄글로 작성할 것:
                    - 제품 A의 주요 특징(태그)과 추천 피부 타입을 설명해.
                    - 제품 B의 주요 특징(태그)과 추천 피부 타입을 설명해.
                    - 마지막으로 제공된 [사용자 피부 정보]를 종합적으로 고려했을 때, 두 제품 중 어떤 제품이 회원님에게 더 알맞은지 그 이유(피부 타입 매칭 결과 등)와 함께 명확하게 추천해 줘.
          
                          [출력 JSON 포맷]
                {
                  "comparisonText": "여기에 비교 분석 및 추천 내용을 줄글로 작성"
                }
                """;

      Map<String, Object> requestBodyMap = Map.of(
          "systemInstruction", Map.of("parts", new Object[]{Map.of("text", systemPrompt)}),
          "contents", new Object[]{Map.of("role", "user", "parts", new Object[]{Map.of("text", comparisonContext)})},
          "generationConfig", Map.of("responseMimeType", "application/json")
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
              return objectMapper.readValue(contentJson, AiComparisonResponse.class);

            } catch (Exception e) {
              throw new RuntimeException("JSON 파싱 에러", e);
            }
          })
          .exceptionally(ex -> {
            System.err.println("LLM 비교 분석 중 오류: " + ex.getMessage());
            return new AiComparisonResponse(
                "🌿 두 제품을 분석하는 중에 잠시 문제가 발생했어요. 💧 하지만 걱정 마세요! 성분표를 보니 두 제품 모두 회원님의 스킨케어에 새로운 활력을 불어넣어 줄 훌륭한 아이템들입니다! 잠시 후 다시 시도해 주세요."
            );
          });

    } catch (Exception e) {
      return CompletableFuture.failedFuture(e);
    }
  }
}
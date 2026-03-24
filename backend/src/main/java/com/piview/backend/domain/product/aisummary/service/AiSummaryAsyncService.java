package com.piview.backend.domain.product.aisummary.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.piview.backend.domain.product.aisummary.dto.AiSummaryResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

// 외부 AI API 통신 및 비동기 처리만 담당.
@Service
public class AiSummaryAsyncService {

  // application.yml 파일에서 API 키를 주입받음
  @Value("${gemini.api.key}")
  private String apiKey;

  // GMS 또는 OpenAI API 엔드포인트
  private static final String API_URL = "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

  private final ObjectMapper objectMapper = new ObjectMapper();
  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(10)) // 타임아웃 설정 (안전성 확보)
      .build();

  public CompletableFuture<AiSummaryResponse> getProductSummaryAsync(String productDetails) {

    try {
      String systemPrompt = """
                너는 뷰티 앱 '피뷰(FiView)'의 전문 에디터 AI야.
                어려운 단어는 사용하지 않고 부드럽게 답해. 
                사용자가 제공하는 제품 정보를 바탕으로 3줄 요약을 작성해.
                
                [작성 규칙]
                1. 반드시 아래의 JSON 형식으로만 출력할 것. 다른 형태(배열 등)는 절대 사용 금지.
                2. 각 줄의 시작에는 어울리는 이모지를 1개씩 넣을 것.
                3. 내용 구성:
                  - line1: 사용자의 피부 타입과 이 제품의 궁합(잘 맞는지, 주의가 필요한지)을 분석하고, 가장 '추천하는 피부 타입'을 명시해 줘.\s
                    (예: "💧 수부지 피부인 고객님께는 유분기가 다소 무거울 수 있어요! 이 제품은 '극건성' 피부에게 가장 추천해요.")
                  - line2: 제공된 [제품 태그]를 바탕으로, 이 제품이 사용자의 어떤 피부 고민을 해결하는 데 도움을 줄 수 있는지 1~2가지만 자연스럽게 언급해 줘.
                  - line3: 제공된 [제품 원문 성분]을 분석해서 타 화장품 성분과의 충돌 위험을 확인해 줘. 만약 충돌 위험이 있다면 반드시 "이 제품에 함유된 [제품 내 특정 성분명] 성분이 다른 화장품의 [충돌 예상 성분명] 성분과 만날 경우 자극이 될 수 있으니 피해주세요"라는 형식으로, 원인이 되는 2가지 성분을 모두 구체적으로 명시해서 경고해 줘. 딱히 충돌 위험이 없다면 뷰티 에디터로서의 유용한 사용 팁을 하나 알려줘.
                
                [출력 JSON 포맷]
                {
                  "line1": "여기에 첫 번째 문장 작성",
                  "line2": "여기에 두 번째 문장 작성",
                  "line3": "여기에 세 번째 문장 작성"
                }
                """;

      Map<String, Object> requestBodyMap = Map.of(
          // 시스템 프롬프트 설정
          "systemInstruction", Map.of(
              "parts", new Object[]{Map.of("text", systemPrompt)}
          ),
          // 유저 프롬프트 (제품 정보) 설정
          "contents", new Object[]{
              Map.of(
                  "role", "user",
                  "parts", new Object[]{Map.of("text", productDetails)}
              )
          },
          // JSON 응답 강제 설정
          "generationConfig", Map.of(
              "responseMimeType", "application/json",
              "temperature", 0.0
          )
      );

      String requestBody = objectMapper.writeValueAsString(requestBodyMap);

      // 💡 Gemini API는 헤더에 'x-goog-api-key'로 키를 전달합니다.
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(API_URL))
          .header("Content-Type", "application/json")
          .header("x-goog-api-key", apiKey)
          .POST(HttpRequest.BodyPublishers.ofString(requestBody))
          .build();

      // 비동기 API 호출
      return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
          .thenApply(response -> {
            if (response.statusCode() != 200) {
              throw new RuntimeException("API 응답 에러: " + response.body());
            }
            try {
              System.out.println("====== Gemini 서버 전체 응답 ======");
              System.out.println(response.body());
              System.out.println("================================");

              var rootNode = objectMapper.readTree(response.body());

              // 💡 Gemini 응답 구조에 맞춘 파싱: candidates[0].content.parts[0].text
              String contentJson = rootNode.path("candidates").get(0)
                  .path("content").path("parts").get(0).path("text").asText();

              // 혹시 모를 마크다운 태그(```json) 제거 처리
              if (contentJson.startsWith("```json")) {
                contentJson = contentJson.replace("```json", "").replace("```", "").trim();
              } else if (contentJson.startsWith("```")) {
                contentJson = contentJson.replace("```", "").trim();
              }

              // 깔끔해진 순수 JSON 문자열을 DTO로 변환
              return objectMapper.readValue(contentJson, AiSummaryResponse.class);

            } catch (Exception e) {
              throw new RuntimeException("JSON 파싱 에러", e);
            }
          })
          .exceptionally(ex -> {
            System.err.println("LLM 생성 중 오류: " + ex.getMessage());
            return new AiSummaryResponse(
                "💧 AI 한마디를 불러오는 중 문제가 발생했어요.",
                "🌿 잠시 후 다시 시도해 주세요.",
                "💡 피뷰 팀이 빠르게 확인 중입니다!"
            );
          });

    } catch (Exception e) {
      return CompletableFuture.failedFuture(e);
    }
  }
}
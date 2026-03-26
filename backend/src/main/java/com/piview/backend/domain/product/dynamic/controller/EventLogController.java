package com.piview.backend.domain.product.dynamic.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.piview.backend.domain.product.dynamic.dto.EventLogRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.*;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Tag(name = "동적을 위한 추천 이벤트 API", description = "제품 클릭, 검색, 좋아요 시 서버로 이벤트를 보내는 API")
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/logs")
public class EventLogController {

  private static final Logger ACTION_LOGGER = LoggerFactory.getLogger("USER_ACTION_LOGGER");
  private final ObjectMapper objectMapper;

  @Operation(summary = "서버로 이벤트 보내는 API", description = "사용자가 제품 클릭, 검색, 좋아요 시 서버로 보냄")
  @PostMapping("/events")
  public ResponseEntity<Void> collectUserAction(@RequestBody EventLogRequest request) {
    try {
      String jsonString = objectMapper.writeValueAsString(request);
      ACTION_LOGGER.info(jsonString);

    } catch (Exception e) {
      log.error("사용자 행동 로그 기록 실패: {}", request, e);
    }
    return ResponseEntity.ok().build();
  }

  @Operation(summary = "서버용이라 연결 x", description = "서버에서 확인용이라 연결하지 않습니다.")
  @GetMapping("/run-duckdb")
  public String testDuckDbBatch() throws SQLException {
    log.info("🧪 [Test] DuckDB 분석 테스트 시작 (파일 복사 방식)");

    Path logDir = Paths.get("./logs/piview");
    Path tempDir = Paths.get("./logs/piview/temp_test_" + UUID.randomUUID());
    String url = "jdbc:duckdb:";
    
    int count = 0;
    StringBuilder resultBuilder = new StringBuilder();

    try {
      // 1. 임시 디렉토리 생성 및 로그 파일 복사 (윈도우 파일 잠금 회피)
      Files.createDirectories(tempDir);
      try (Stream<Path> files = Files.list(logDir)) {
        List<Path> logFiles = files
            .filter(f -> f.getFileName().toString().startsWith("user-events"))
            .collect(Collectors.toList());
        
        for (Path file : logFiles) {
          Files.copy(file, tempDir.resolve(file.getFileName()), StandardCopyOption.REPLACE_EXISTING);
        }
      }

      // 2. DuckDB 쿼리 실행
      String query = String.format("""
          SELECT 
            CAST(userId AS BIGINT) AS userId, 
            CAST(productId AS BIGINT) AS productId, 
            SUM(CASE
              WHEN UPPER(TRIM(CAST(eventType AS VARCHAR))) = 'LIKE' THEN 5 
              WHEN UPPER(TRIM(CAST(eventType AS VARCHAR))) = 'SEARCH' THEN 2 
              WHEN UPPER(TRIM(CAST(eventType AS VARCHAR))) = 'VIEW_PRODUCT' THEN 1
              ELSE 0 
            END) AS preference_score 
          FROM read_json_auto('%s/user-events*.log')
          WHERE userId IS NOT NULL AND productId IS NOT NULL
          GROUP BY userId, productId
          ORDER BY userId, preference_score DESC
          """, tempDir.toString().replace("\\", "/"));

      try (Connection conn = DriverManager.getConnection(url);
           Statement stmt = conn.createStatement();
           ResultSet rs = stmt.executeQuery(query)) {

        while (rs.next()) {
          Long userId = rs.getLong("userId");
          Long productId = rs.getLong("productId");
          int score = rs.getInt("preference_score");

          String msg = String.format("👉 유저: %d | 상품: %d | 점수: %d\n", userId, productId, score);
          System.out.print(msg);
          resultBuilder.append(msg);
          count++;
        }
      }
    } catch (IOException e) {
      log.error("로그 파일 복사 실패", e);
      return "파일 복사 실패: " + e.getMessage();
    } finally {
      cleanupTempDir(tempDir);
    }

    return "✅ 분석 완료! 총 " + count + "건\n" + resultBuilder.toString();
  }

  private void cleanupTempDir(Path path) {
    try (Stream<Path> walk = Files.walk(path)) {
      walk.sorted((p1, p2) -> p2.compareTo(p1))
          .forEach(p -> {
            try {
              Files.delete(p);
            } catch (IOException e) {
              log.warn("임시 파일 삭제 실패: {}", p);
            }
          });
    } catch (IOException e) {
      log.warn("임시 디렉토리 정리 실패", e);
    }
  }
}

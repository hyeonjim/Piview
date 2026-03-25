package com.piview.backend.domain.product.dynamic.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.*;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationBatchService {

  private final JdbcTemplate jdbcTemplate;

  // 인메모리 DB 사용
  private static final String DUCKDB_URL = "jdbc:duckdb:";

//  @Scheduled(cron = "0 * * * * ?") // 테스트를 위해 매분 실행
  @Scheduled(cron = "0 0 0/6 * * ?")
  @Transactional
  public void syncRecommendationScores() throws SQLException {
    log.info("🚀 DuckDB -> 메인 DB 추천 점수 동기화 배치 시작!");
    long startTime = System.currentTimeMillis();

    Path logDir = Paths.get("./logs/piview");
    Path tempDir = Paths.get("./logs/piview/temp_batch_" + UUID.randomUUID());
    
    List<ScoreDto> scores = new ArrayList<>();

    try {
      // 1. 임시 디렉토리 생성 및 로그 파일 복사
      Files.createDirectories(tempDir);
      try (Stream<Path> files = Files.list(logDir)) {
        List<Path> logFiles = files
            .filter(f -> f.getFileName().toString().startsWith("user-events"))
            .collect(Collectors.toList());
        
        for (Path file : logFiles) {
          Files.copy(file, tempDir.resolve(file.getFileName()), StandardCopyOption.REPLACE_EXISTING);
        }
      }

      // 2. DuckDB 쿼리 (userId, productId를 명시적으로 BIGINT로 캐스팅)
      String duckDbQuery = String.format("""
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

      try (Connection duckConn = DriverManager.getConnection(DUCKDB_URL);
           Statement stmt = duckConn.createStatement();
           ResultSet rs = stmt.executeQuery(duckDbQuery)) {

        while (rs.next()) {
          scores.add(new ScoreDto(
              rs.getLong("userId"),
              rs.getLong("productId"),
              rs.getBigDecimal("preference_score")
          ));
        }
      }
    } catch (IOException e) {
      log.error("❌ 로그 파일 복사 중 오류 발생", e);
      return;
    } catch (Exception e) {
      log.error("❌ DuckDB 실행 중 데이터 변환 오류 발생 (데이터 형식 확인 필요)", e);
      return;
    } finally {
      cleanupTempDir(tempDir);
    }

    if (scores.isEmpty()) {
      log.info("동기화할 추천 점수 데이터가 없습니다.");
      return;
    }

    // 4. 메인 DB 반영
    jdbcTemplate.update("TRUNCATE TABLE recommendation_score");
    String sql = "INSERT INTO recommendation_score (user_id, product_id, score, updated_at) VALUES (?, ?, ?, NOW())";
    jdbcTemplate.batchUpdate(sql, scores, 1000, (ps, score) -> {
      ps.setLong(1, score.userId());
      ps.setLong(2, score.productId());
      ps.setBigDecimal(3, score.score());
    });

    long endTime = System.currentTimeMillis();
    log.info("✅ 추천 점수 동기화 완료! 총 {}건 반영 (소요시간: {}ms)", scores.size(), (endTime - startTime));
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

  private record ScoreDto(Long userId, Long productId, java.math.BigDecimal score) {}
}

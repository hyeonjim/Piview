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

  @Scheduled(cron = "0 * * * * ?") // 테스트를 위해 매분 실행
//  @Scheduled(cron = "0 0 0/6 * * ?")
  @Transactional
  public void syncRecommendationScores() throws SQLException {
      log.info("🚀 DuckDB -> 메인 DB 추천 점수 동기화 배치 시작!");
      long startTime = System.currentTimeMillis();

      Path logDir = Paths.get("./logs/piview");

      // 로그 폴더가 없으면 조기 종료
      if (!Files.exists(logDir)) {
          log.info("동기화할 로그 폴더가 없습니다. 배치를 종료합니다.");
          return;
      }

      List<Path> logFiles;
      // 폴더는 있지만 'user-events'로 시작하는 로그 파일이 없으면 조기 종료
      try (Stream<Path> files = Files.list(logDir)) {
          logFiles = files
                  .filter(f -> f.getFileName().toString().startsWith("user-events"))
                  .collect(Collectors.toList());
      } catch (IOException e) {
          log.error("❌ 로그 폴더를 읽는 중 오류 발생", e);
          return;
      }

      if (logFiles.isEmpty()) {
          log.info("동기화할 이벤트 로그 파일이 없습니다. 배치를 종료합니다.");
          return;
      }

      Path tempDir = Paths.get("./logs/piview/temp_batch_" + UUID.randomUUID());

      List<ScoreDto> scores = new ArrayList<>();
      List<SimilarityDto> similarities = new ArrayList<>();

      try {
          // 1. 임시 디렉토리 생성 및 로그 파일 복사
          Files.createDirectories(tempDir);
          for (Path file : logFiles) {
              Files.copy(file, tempDir.resolve(file.getFileName()), StandardCopyOption.REPLACE_EXISTING);
          }

          String tempDirPath = tempDir.toString().replace("\\", "/");

          // 2. DuckDB 쿼리 (userId, productId를 명시적으로 BIGINT로 캐스팅)
          String scoreQuery = String.format("""
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
                  """, tempDirPath);

          // 3. DuckDB 쿼리 2: 상품 간 연관도(유사도) 점수 계산
          String similarityQuery = String.format("""
                  WITH user_products AS (
                      SELECT DISTINCT 
                          CAST(userId AS BIGINT) AS userId, 
                          CAST(productId AS BIGINT) AS productId
                      FROM read_json_auto('%s/user-events*.log')
                      WHERE userId IS NOT NULL AND productId IS NOT NULL
                  )
                  SELECT 
                      a.productId AS product_id, 
                      b.productId AS related_product_id, 
                      COUNT(*) AS similarity_score
                  FROM user_products a
                  JOIN user_products b 
                    ON a.userId = b.userId 
                    AND a.productId != b.productId
                  GROUP BY a.productId, b.productId
                  ORDER BY a.productId, similarity_score DESC
                  """, tempDirPath);

          // 하나의 커넥션으로 두 가지 쿼리를 순차적으로 실행하여 효율성 극대화!
          try (Connection duckConn = DriverManager.getConnection(DUCKDB_URL);
               Statement stmt = duckConn.createStatement()) {

              // 3-1. 유저 점수 데이터 뽑기
              try (ResultSet rs = stmt.executeQuery(scoreQuery)) {
                  while (rs.next()) {
                      scores.add(new ScoreDto(
                              rs.getLong("userId"),
                              rs.getLong("productId"),
                              rs.getBigDecimal("preference_score")
                      ));
                  }
              }

              // 3-2. 연관 상품 데이터 뽑기
              try (ResultSet rs = stmt.executeQuery(similarityQuery)) {
                  while (rs.next()) {
                      similarities.add(new SimilarityDto(
                              rs.getLong("product_id"),
                              rs.getLong("related_product_id"),
                              rs.getLong("similarity_score")
                      ));
                  }
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

      // 4. 메인 DB 반영 - 유저별 점수
      if (!scores.isEmpty()) {
          jdbcTemplate.update("TRUNCATE TABLE recommendation_score");
          String sql1 = "INSERT INTO recommendation_score (user_id, product_id, score, updated_at) VALUES (?, ?, ?, NOW())";
          jdbcTemplate.batchUpdate(sql1, scores, 1000, (ps, score) -> {
              ps.setLong(1, score.userId());
              ps.setLong(2, score.productId());
              ps.setBigDecimal(3, score.score());
          });
      }

      // 5. 메인 DB 반영 - 상품별 유사도
      if (!similarities.isEmpty()) {
          jdbcTemplate.update("TRUNCATE TABLE product_similarity");
          String sql2 = "INSERT INTO product_similarity (product_id, related_product_id, similarity_score) VALUES (?, ?, ?)";
          jdbcTemplate.batchUpdate(sql2, similarities, 1000, (ps, sim) -> {
              ps.setLong(1, sim.productId());
              ps.setLong(2, sim.relatedProductId());
              ps.setLong(3, sim.similarityScore());
          });
      }

      long endTime = System.currentTimeMillis();
      log.info("✅ 추천/연관 데이터 동기화 완료! 유저점수 {}건, 연관상품 {}건 반영 (소요시간: {}ms)",
              scores.size(), similarities.size(), (endTime - startTime));
  }

    // 임시 폴더 정리 로직 유지
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

    // 내부 DTO 레코드들
    private record ScoreDto(Long userId, Long productId, java.math.BigDecimal score) {}
    private record SimilarityDto(Long productId, Long relatedProductId, Long similarityScore) {}
}

# DuckDB 추천 점수 동기화 배치 트러블슈팅 가이드

이 문서는 `RecommendationBatchService`에서 발생한 DuckDB 관련 오류와 이를 해결하기 위한 과정 및 최종 솔루션을 기록합니다.

## 1. 발생 현상 및 오류 메시지

### 현상
Spring Boot의 `@Scheduled` 배치가 실행될 때, DuckDB가 로그 파일을 읽지 못하고 중단됨.

### 주요 오류 메시지
1. **JDBC URL 형식 오류**
   - `java.sql.SQLException: IO Error: Cannot open file "...?access_mode=read_only"`
   - 원인: Windows 환경에서 URL 파라미터(`?`)를 파일 경로의 일부로 오인하여 발생.

2. **파일 잠금(File Locking) 충돌**
   - `java.sql.SQLException: IO Error: File is already open in ... (PID XXXX)`
   - 원인: Spring Boot의 로거(Logback)가 현재 기록 중인 `user-events.log` 파일을 독점적으로 점유하고 있어, DuckDB 네이티브 엔진이 해당 파일에 접근하지 못함.

3. **인메모리 모드 설정 제한**
   - `java.sql.SQLException: Catalog Error: Cannot launch in-memory database in read-only mode!`
   - 원인: `jdbc:duckdb::memory:` 사용 시 연결 시점에 `READ_ONLY` 옵션을 줄 수 없는 DuckDB 제약 사항.

## 2. 원인 분석 (Root Cause)

- **운영체제 특성**: Windows는 파일이 쓰기 모드로 열려 있을 때 다른 프로세스의 읽기 접근을 엄격하게 제한하는 경향이 있음 (Linux 대비 강한 파일 잠금).
- **로거-DB 충돌**: 애플리케이션이 실시간으로 사용자 행동을 로그로 기록하고 있는 상황에서, 같은 애플리케이션 내의 DuckDB 엔진이 해당 물리 파일에 직접 접근하려고 시도하며 충돌 발생.

## 3. 최종 해결 방안: 임시 복사(Copy-and-Analyze) 전략

Windows의 파일 잠금 문제를 근본적으로 피하기 위해 로그 파일을 임시 위치로 복사한 뒤 분석하는 방식을 채택했습니다.

### 해결 단계
1. **임시 디렉토리 생성**: 배치 실행 시마다 고유한 UUID를 가진 임시 폴더를 생성합니다.
2. **로그 파일 복사**: 현재 잠겨 있는 로그 파일들을 `java.nio.file.Files.copy`를 사용하여 임시 폴더로 복사합니다. (복사본은 잠금 상태가 아니므로 자유롭게 읽기 가능)
3. **DuckDB 분석**: DuckDB가 원본 로그가 아닌 **임시 폴더의 복사본**을 읽도록 쿼리를 실행합니다.
4. **결과 반영**: 분석된 추천 점수를 메인 데이터베이스(`recommendation_score` 테이블)에 동기화합니다.
5. **사후 정리(Cleanup)**: 분석이 완료되면 생성했던 임시 폴더와 복사본을 즉시 삭제합니다.

### 핵심 코드 스니펫

```java
// 1. 임시 디렉토리 생성 및 로그 파일 복사
Path tempDir = Paths.get("./logs/piview/temp_batch_" + UUID.randomUUID());
Files.createDirectories(tempDir);
for (Path file : logFiles) {
    Files.copy(file, tempDir.resolve(file.getFileName()), StandardCopyOption.REPLACE_EXISTING);
}

// 2. DuckDB 쿼리 (복사본 참조)
String duckDbQuery = String.format("SELECT ... FROM read_json_auto('%s/user-events*.log') ...", 
    tempDir.toString().replace("\\", "/"));

// 3. 리소스 정리 (finally 블록)
cleanupTempDir(tempDir);
```

## 4. 기대 효과
- **안정성**: 로거가 파일을 쓰는 중에도 배치 작업이 중단 없이 수행됨.
- **환경 독립성**: Windows, Linux 등 운영체제의 파일 잠금 정책과 상관없이 일관되게 동작함.
- **리소스 최적화**: 분석이 끝난 즉시 임시 파일을 삭제하여 디스크 낭비를 방지함.

package com.piview.backend.domain.ocr.recognition.service;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.domain.ocr.recognition.dto.OcrFastApiResponseDto;
import com.piview.backend.domain.ocr.recognition.dto.OcrRecognitionResponseDto;
import com.piview.backend.domain.ocr.recognition.repository.OcrProductRepository;
import com.piview.backend.domain.product.entity.Product;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
public class OcrRecognitionService {

    private final OcrProductRepository productRepository;
    private final RestClient restClient;
    private final String fastApiBaseUrl;

    private record ScoredProduct(Product product, int score) {}

    // 생성자 -> 여기서 RestClient에 타임아웃 씌우기
    public OcrRecognitionService(
            OcrProductRepository productRepository,
            @Value("${fastapi.base-url}") String fastApiBaseUrl) {

        this.productRepository = productRepository;
        this.fastApiBaseUrl = fastApiBaseUrl;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(20000); // 파이썬 서버와 연결하는 데 3초 이상 걸리면 포기
        requestFactory.setReadTimeout(20000);   // 파이썬 서버가 분석 결과를 10초 안에 안 주면 포기

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    // 이미지 받아서 파이썬 서버로 보내고 단어리스트 받기
    public OcrRecognitionResponseDto processImageRecognition(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_IMAGE_FILE);
        }

        List<String> extractedWords = extractTextFromFastApi(image);
        log.info("📸 [OCR 단어 추출 완료] : {}", extractedWords);

        // 받아온 단어 리스트로 매칭 알고리즘 실행
        return findBestMatchingProduct(extractedWords);
    }

    // fastapi 통신 메서드
    private List<String> extractTextFromFastApi(MultipartFile file) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", file.getResource());

            OcrFastApiResponseDto ocrResponse = restClient.post()
                    .uri(fastApiBaseUrl + "/ocr/extract-text")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(OcrFastApiResponseDto.class);

            if (ocrResponse == null || !"success".equals(ocrResponse.status()) || ocrResponse.top_candidates() == null) {
                throw new CustomException(ErrorCode.AI_TEXT_EXTRACTION_FAILED);
            }

            return ocrResponse.top_candidates().stream()
                    .map(OcrFastApiResponseDto.Candidate::text)
                    .collect(Collectors.toList());

        } catch (RestClientException e) {
            // 타임아웃 선을 넘어서 Exception이 터지면 여기서 잡아서 프론트엔드로 전달
            log.error("❌ FastAPI 통신 지연/에러: ", e);
            throw new CustomException(ErrorCode.AI_SERVER_TIMEOUT);
        }
    }

    // product db 매칭 및 채점 로직
    private OcrRecognitionResponseDto findBestMatchingProduct(List<String> cleanedWords) {
        if (cleanedWords == null || cleanedWords.isEmpty()) {
            throw new CustomException(ErrorCode.OCR_TEXT_NOT_FOUND);
        }

        // 1차 후보 긁어오기 : 공백 제거 + 중복 방지
        Set<Product> candidateProducts = new HashSet<>();
        for (String word : cleanedWords) {
            if (word.length() >= 2) {
                String searchKeyword = word.replaceAll("\\s+", "");
                candidateProducts.addAll(
                        productRepository.findByBrand_BrandNameContainingOrNameContaining(searchKeyword, searchKeyword)
                );
            }
        }

        if (candidateProducts.isEmpty()) {
            throw new CustomException(ErrorCode.COSMETICS_NOT_FOUND);
        }

        // 정밀 채점
        List<ScoredProduct> scoredList = new ArrayList<>();
        for (Product product : candidateProducts) {
            int currentScore = calculateMatchScore(product, cleanedWords);
            if (currentScore > 0) {
                scoredList.add(new ScoredProduct(product, currentScore));
            }
        }

        if (scoredList.isEmpty()) {
            throw new CustomException(ErrorCode.COSMETICS_NOT_FOUND);
        }

        // 점수 내림차순
        scoredList.sort((a, b) -> Integer.compare(b.score(), a.score()));

        Product bestProduct = scoredList.get(0).product();
        int bestScore = scoredList.get(0).score();

        // 제일 높은 점수의 상품만 dto로 반환
        return OcrRecognitionResponseDto.builder()
                .isSuccess(true)
                .productId(bestProduct.getProductId())
                .brandName(bestProduct.getBrand().getBrandName())
                .productName(bestProduct.getName())
                .matchAccuracy(bestScore)
                .build();
    }

    // 우선순위 가중치 채점
    private int calculateMatchScore(Product product, List<String> words) {
        int score = 0;

        // 마케팅 문구 정규식으로 제거([1+1], (증정))
        String cleanName = product.getName().replaceAll("\\[.*?\\]", "").replaceAll("\\(.*?\\)", "").trim();
        String fullName = product.getBrand().getBrandName() + " " + cleanName;
        String fullNameNoSpace = fullName.replaceAll("\\s+", "");
        String[] dbTokens = cleanName.split("\\s+");

        // 추출된 단어의 순서(우선순위)에 따른 가중치
        int[] weights = {50, 40, 30, 20, 10};

        for (int i = 0; i < Math.min(words.size(), 5); i++) {
            String word = words.get(i).trim();
            if (word.length() < 2) continue;

            String wordNoSpace = word.replaceAll("\\s+", "");
            // 기본 가중치에 글자 길이당 5점의 가산점을 부여
            int wordFullScore = weights[i] + (wordNoSpace.length() * 5);

            // if 완벽일치 -> 100% 점수 부여
            if (fullNameNoSpace.contains(wordNoSpace)) {
                score += wordFullScore;
            } else {
                // if 부분/오타 일치 : 레벤슈타인 알고리즘을 통한 오타 보정 탐색 시작
                boolean isTypoMatch = false;
                String[] ocrTokens = word.split("\\s+");
                for (String oToken : ocrTokens) {
                    if (oToken.length() < 2) continue;
                    for (String dbToken : dbTokens) {
                        // 글자 수 차이가 2글자 이상 나면 아예 다른 단어로 간주하고 패스 (연산 최적화)
                        if (Math.abs(dbToken.length() - oToken.length()) > 1) continue;

                        // 레벤슈타인 거리를 계산하여 오타 개수 확인
                        int distance = calculateLevenshteinDistance(oToken, dbToken);

                        // 글자가 길면 오타 2개까지, 짧으면 1개까지만 허용
                        int allowedTypos = oToken.length() >= 4 ? 2 : 1;
                        if (distance <= allowedTypos) {
                            isTypoMatch = true;
                            // 매칭 성공시 바로 break
                            break;
                        }
                    }
                    if (isTypoMatch) break;
                }
                // 오타 인정후 매칭된 경우 패널티 적용하여 원점수의 80%만 부여
                if (isTypoMatch) {
                    score += (int) (wordFullScore * 0.8);
                }
            }
        }
        return score;
    }

    // 동적 계획법(DP) 기반 레벤슈타인 거리
    private int calculateLevenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        for (int i = 0; i <= s1.length(); i++) {
            for (int j = 0; j <= s2.length(); j++) {
                if (i == 0) dp[i][j] = j;
                else if (j == 0) dp[i][j] = i;
                else {
                    int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;
                    dp[i][j] = Math.min(dp[i - 1][j - 1] + cost, Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1));
                }
            }
        }
        return dp[s1.length()][s2.length()];
    }
}

package com.piview.backend.domain.product.catalog.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class ProductSearchAiClient {

    private final RestClient restClient;
    private final String fastApiBaseUrl;

    public ProductSearchAiClient(
            @Value("${fastapi.base-url}") String fastApiBaseUrl,
            @Value("${product-search.vector.timeout-ms:2000}") int timeoutMs
    ) {
           this.fastApiBaseUrl = fastApiBaseUrl;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(1000);
        requestFactory.setReadTimeout(timeoutMs);

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    public List<Long> searchRankedProductIds(String query, int candidateLimit) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        long startedAt = System.nanoTime();
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(fastApiBaseUrl)
                    .path("/products/search")
                    .queryParam("q", query)
                    .queryParam("candidateLimit", candidateLimit)
                    .encode(StandardCharsets.UTF_8)
                    .build()
                    .toUri();

            ProductSearchAiQueryResponse response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(ProductSearchAiQueryResponse.class);

            if (response == null || response.results() == null) {
                log.info(
                        "Product search AI returned empty body: query='{}', candidateLimit={}, elapsedMs={}",
                        query,
                        candidateLimit,
                        elapsedMillis(startedAt)
                );
                return List.of();
            }

            List<Long> productIds = response.results().stream()
                    .map(ProductSearchAiResult::productId)
                    .filter(id -> id != null && id > 0)
                    .distinct()
                    .toList();
            log.info(
                    "Product search AI success: query='{}', candidateLimit={}, elapsedMs={}, resultCount={}",
                    query,
                    candidateLimit,
                    elapsedMillis(startedAt),
                    productIds.size()
            );
            return productIds;

        } catch (RestClientResponseException exception) {
            log.warn(
                    "Product search AI error: query='{}', candidateLimit={}, status={}, elapsedMs={}",
                    query,
                    candidateLimit,
                    exception.getStatusCode().value(),
                    elapsedMillis(startedAt)
            );
            return List.of();
        } catch (RestClientException exception) {
            log.warn(
                    "Product search AI network error: query='{}', candidateLimit={}, elapsedMs={}",
                    query,
                    candidateLimit,
                    elapsedMillis(startedAt),
                    exception
            );
            return List.of();
        }
    }

    private long elapsedMillis(long startedAt) {
        return TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt);
    }
}

record ProductSearchAiQueryResponse(
        String query,
        List<ProductSearchAiResult> results
) {

}

record ProductSearchAiResult(
        Long productId,
        Double rawScore,
        Double distance,
        List<String> matchedSources
) {

}

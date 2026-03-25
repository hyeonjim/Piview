package com.piview.backend.domain.product.catalog.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@Slf4j
@Component
public class ProductSearchAiClient {

    private final RestClient restClient;
    private final String fastApiBaseUrl;
    private final boolean vectorSearchEnabled;

    public ProductSearchAiClient(
            @Value("${fastapi.base-url}") String fastApiBaseUrl,
            @Value("${product-search.vector.enabled:true}") boolean vectorSearchEnabled,
            @Value("${product-search.vector.timeout-ms:1200}") int timeoutMs
    ) {
           this.fastApiBaseUrl = fastApiBaseUrl;
           this.vectorSearchEnabled = vectorSearchEnabled;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(1000);
        requestFactory.setReadTimeout(timeoutMs);

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    public List<Long> searchRankedProductIds(String query, int candidateLimit) {
        if (!vectorSearchEnabled || query == null || query.isBlank()) {
            return List.of();
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl(fastApiBaseUrl)
                    .path("/products/search")
                    .queryParam("q", query)
                    .queryParam("candidateLimit", candidateLimit)
                    .toUriString();

            ProductSearchAiQueryResponse response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(ProductSearchAiQueryResponse.class);

            if (response == null || response.results() == null) {
                return List.of();
            }

            return response.results().stream()
                    .map(ProductSearchAiResult::productId)
                    .filter(id -> id != null && id > 0)
                    .distinct()
                    .toList();

        } catch (RestClientResponseException exception) {
            log.warn("Product search API error: status={}", exception.getStatusCode().value());
            return List.of();
        } catch (RestClientException exception) {
            log.warn("Product search API network error", exception);
            return List.of();
        }
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

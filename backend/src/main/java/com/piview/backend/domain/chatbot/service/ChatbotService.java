package com.piview.backend.domain.chatbot.service;

import com.piview.backend.domain.chatbot.dto.request.ChatbotQueryRequest;
import com.piview.backend.domain.chatbot.dto.response.ChatbotQueryResponse;
import com.piview.backend.domain.product.catalog.repository.ProductRepository;
import com.piview.backend.domain.product.catalog.dto.ProductSummaryResponse;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.routine.item.dto.MyCosResponseDto;
import com.piview.backend.domain.routine.item.service.MyCosService;
import com.piview.backend.domain.user.disliked.dto.response.DislikedIngredientSummaryResponse;
import com.piview.backend.domain.user.disliked.dto.response.DislikedProductSummaryResponse;
import com.piview.backend.domain.user.disliked.service.UserDislikedProductService;
import com.piview.backend.domain.user.profile.dto.response.UserProfileResponse;
import com.piview.backend.domain.user.profile.service.UserProfileService;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatbotService {

    private final ChatbotAiClient chatbotAiClient;
    private final ProductRepository productRepository;
    private final UserProfileService userProfileService;
    private final MyCosService myCosService;
    private final UserDislikedProductService userDislikedProductService;

    public ChatbotQueryResponse query(Long userId, ChatbotQueryRequest request) {
        // 챗봇 요청의 실제 오케스트레이션은 여기서 한다.
        // 1) backend가 사용자 관련 데이터를 각 도메인 서비스에서 읽고
        // 2) ai가 이해하기 쉬운 userContext 하나로 묶고
        // 3) 내부 AI API(/chat/query)에 전달한 뒤
        // 4) AI 응답을 프론트 공개 응답 DTO로 다시 감싼다.
        UserProfileResponse userProfile = userProfileService.getMyProfile(userId);
        List<MyCosResponseDto> myCosList = myCosService.getMyCosList(userId);
        List<DislikedIngredientSummaryResponse> dislikedIngredients = userDislikedProductService.getDislikedIngredients(userId);
        List<DislikedProductSummaryResponse> dislikedProducts = userDislikedProductService.getDislikedProducts(userId);

        // 프론트 요청에는 message / sessionId / context만 들어오고,
        // 개인화 정보는 backend가 별도로 수집해서 userContext에 채워 넣는다.
        ChatbotAiQueryResponse aiResponse = chatbotAiClient.query(new ChatbotAiQueryRequest(
            request.message(),
            request.sessionId(),
            toAiClientContext(request.context()),
            toAiUserContext(userId, userProfile, myCosList, dislikedIngredients, dislikedProducts)
        ));

        return new ChatbotQueryResponse(
            aiResponse.sessionId(),
            aiResponse.answer(),
            toProductCandidates(aiResponse.products()),
            aiResponse.appliedFilters() != null ? aiResponse.appliedFilters() : Map.of(),
            toCitations(aiResponse.citations())
        );
    }

    private ChatbotAiClientContext toAiClientContext(ChatbotQueryRequest.ChatbotClientContext context) {
        if (context == null) {
            return null;
        }

        // 화면 위치나 현재 보고 있던 상품 ID는 검색/상세 진입점별 응답 튜닝용 메타정보다.
        return new ChatbotAiClientContext(
            context.screen(),
            context.currentProductId()
        );
    }

    private ChatbotAiUserContext toAiUserContext(
        Long userId,
        UserProfileResponse userProfile,
        List<MyCosResponseDto> myCosList,
        List<DislikedIngredientSummaryResponse> dislikedIngredients,
        List<DislikedProductSummaryResponse> dislikedProducts
    ) {
        // userContext는 지금 flat 구조지만, 의미상으로는 아래 3묶음이다.
        // - profile: 피부타입, 피부 고민
        // - routine: 현재 보유 중인 제품 ID
        // - avoidance: 피하고 싶은 성분/제품
        //
        // 실제 AI 요청에는 하나의 userContext 객체로 전달한다.
        //
        // 각 필드 출처:
        // - userId: 인증 토큰 기반 현재 사용자 ID
        // - mySkinType: users.my_skin_type
        // - skinProblems: my_skin 매핑 결과
        // - myCosProductIds: my_cos에 담긴 productId 목록
        // - dislikedIngredientNames: my_avoid_contri + ingredient join 결과
        // - dislikedProductIds: my_dislike_product에 담긴 productId 목록
        return new ChatbotAiUserContext(
            userId,
            userProfile.getMySkinType() != null ? userProfile.getMySkinType().name() : null,
            userProfile.getSkinProblems() != null ? userProfile.getSkinProblems() : List.of(),
            myCosList.stream()
                .map(MyCosResponseDto::productInfo)
                .filter(Objects::nonNull)
                .map(ProductSummaryResponse::getProductId)
                .toList(),
            dislikedIngredients.stream()
                .map(this::resolveIngredientName)
                // AI 스키마는 list[str]라 배열 안의 null/blank를 허용하지 않으므로 여기서 정리한다.
                .filter(Objects::nonNull)
                .filter(name -> !name.isBlank())
                .toList(),
            dislikedProducts.stream()
                .map(DislikedProductSummaryResponse::productId)
                .filter(Objects::nonNull)
                .toList()
        );
    }

    private String resolveIngredientName(DislikedIngredientSummaryResponse ingredient) {
        // 프롬프트에는 한글 성분명이 더 실용적이므로 가능하면 nameKo를 우선 사용한다.
        if (ingredient.nameKo() != null && !ingredient.nameKo().isBlank()) {
            return ingredient.nameKo();
        }
        if (ingredient.nameEn() != null && !ingredient.nameEn().isBlank()) {
            return ingredient.nameEn();
        }
        return null;
    }

    private List<ChatbotQueryResponse.ChatbotProductCandidate> toProductCandidates(
        List<ChatbotAiProductCandidate> products
    ) {
        // 내부 AI 응답과 공개 응답의 구조를 분리해 두면,
        // 나중에 AI 응답 계약이 조금 바뀌어도 controller까지 영향이 퍼지지 않는다.
        if (products == null || products.isEmpty()) {
            return List.of();
        }

        // 여러 상품이 한 번에 와도 productId들을 모아 한 번에 조회하고,
        // 조회 결과를 productId -> imageUrl 맵으로 만든 뒤 원래 AI 응답 순서를 유지한 채 다시 붙인다.
        //
        // 여기서 예외를 일부러 만들지 않는 기준:
        // - productId가 null이면 imageUrl도 null
        // - DB에 해당 productId가 없으면 imageUrl도 null
        // - 상품은 있지만 이미지가 없으면 imageUrl도 null
        //
        // 즉 "이미지 보강 실패"는 추천 전체를 깨지 않고 해당 항목만 null 처리한다.
        Map<Long, String> imageUrlsByProductId = resolveImageUrls(products);
        return products.stream()
            .map(product -> new ChatbotQueryResponse.ChatbotProductCandidate(
                product.productId(),
                product.name(),
                product.brandName(),
                product.productId() != null ? imageUrlsByProductId.get(product.productId()) : null,
                product.reason()
            ))
            .toList();
    }

    private Map<Long, String> resolveImageUrls(List<ChatbotAiProductCandidate> products) {
        // 중복 productId가 여러 번 언급되더라도 DB는 한 번만 조회한다.
        List<Long> productIds = products.stream()
            .map(ChatbotAiProductCandidate::productId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (productIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, String> imageUrlsByProductId = new HashMap<>();
        for (Product product : productRepository.findByProductIdIn(productIds)) {
            // DB에 존재하는 상품만 맵에 들어간다.
            // image가 없는 상품은 null 값을 넣어 "조회는 됐지만 이미지 없음" 상태를 명시한다.
            imageUrlsByProductId.put(
                product.getProductId(),
                product.getImage() != null ? product.getImage().getUrl() : null
            );
        }
        return imageUrlsByProductId;
    }

    private List<ChatbotQueryResponse.ChatbotCitation> toCitations(List<ChatbotAiCitation> citations) {
        // citation도 내부 응답을 그대로 노출하지 않고 공개 DTO로 한 번 변환한다.
        if (citations == null || citations.isEmpty()) {
            return List.of();
        }

        return citations.stream()
            .map(citation -> new ChatbotQueryResponse.ChatbotCitation(
                citation.type(),
                citation.productId(),
                citation.text()
            ))
            .toList();
    }
}

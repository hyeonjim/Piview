package com.piview.backend.domain.user.disliked.service;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.domain.product.catalog.repository.IngredientRepository;
import com.piview.backend.domain.product.entity.Ingredient;
import com.piview.backend.domain.user.disliked.dto.request.DislikedProductCreateRequest;
import com.piview.backend.domain.user.disliked.dto.response.DislikedProductCreateResponse;
import com.piview.backend.domain.user.disliked.dto.response.DislikedIngredientSummaryResponse;
import com.piview.backend.domain.user.disliked.dto.response.DislikedProductSummaryResponse;
import com.piview.backend.domain.user.disliked.entity.MyAvoidContri;
import com.piview.backend.domain.user.disliked.repository.MyAvoidContriRepository;
import com.piview.backend.domain.user.disliked.repository.MyDislikeProductRepository;
import com.piview.backend.domain.user.login.entity.User;
import com.piview.backend.domain.user.login.repository.UserRepository;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserDislikedProductService {

    private final MyDislikeProductRepository myDislikeProductRepository;
    private final MyAvoidContriRepository myAvoidContriRepository;
    private final UserRepository userRepository;
    private final IngredientRepository ingredientRepository;

    // 안 맞는 제품 목록 조회 API 로직이다. 표시용 상품 정보만 응답 DTO로 변환한다.
    public List<DislikedProductSummaryResponse> getDislikedProducts(Long userId) {
        // 토큰에 담긴 사용자가 실제로 존재하는지 먼저 확인한다.
        findUser(userId);

        // Product 엔티티 PK 매핑과 실DB 스키마가 달라 native 조회로 필요한 표시값만 읽는다.
        return myDislikeProductRepository.findDislikedProductSummariesByUserId(userId).stream()
            .map(row -> new DislikedProductSummaryResponse(
                row.getDislikedProductId(),
                row.getProductId(),
                row.getProductName(),
                row.getBrandName(),
                row.getCategoryName(),
                row.getImageUrl(),
                row.getVolume(),
                row.getPrice(),
                row.getTopSkinType(),
                row.getTop2SkinType()
            ))
            .toList();
    }

    // 문제 성분 목록 조회 API 로직이다. MyAvoidContri에 연결된 Ingredient 상세를 응답으로 만든다.
    public List<DislikedIngredientSummaryResponse> getDislikedIngredients(Long userId) {
        // 토큰에 담긴 사용자가 실제로 존재하는지 먼저 확인한다.
        findUser(userId);

        // 저장된 문제 성분을 성분 상세와 함께 응답으로 변환한다.
        // 표시값은 MyAvoidContri에 문자열로 저장하지 않고 Ingredient를 join해서 가져온다.
        return myAvoidContriRepository.findAllByUserIdWithIngredient(userId).stream()
            .map(avoidContri -> new DislikedIngredientSummaryResponse(
                avoidContri.getIngredient().getIngredientId(),
                avoidContri.getIngredient().getNameKo(),
                avoidContri.getIngredient().getNameEn(),
                avoidContri.getIngredient().getEwgGrade()
            ))
            .toList();
    }

    @Transactional
    // 안 맞는 제품 삭제 API 로직이다. 삭제 후 문제 성분 목록도 즉시 다시 계산한다.
    public void deleteDislikedProduct(Long userId, Long dislikedProductId) {
        // 토큰에 담긴 사용자가 실제로 존재하는지 먼저 확인한다.
        User user = findUser(userId);

        // Product 엔티티 로딩 없이 등록 행을 바로 삭제한다.
        int deletedCount = myDislikeProductRepository.deleteByIdAndUserIdNative(dislikedProductId, userId);
        if (deletedCount == 0) {
            throw new CustomException(ErrorCode.DISLIKED_PRODUCT_NOT_FOUND);
        }

        // 남아 있는 비적합 제품 기준으로 문제 성분 목록을 다시 계산한다.
        syncAvoidIngredients(user);
    }

    @Transactional
    // 안 맞는 제품 등록 API 로직이다. 상품 존재 확인, 중복 방지, 등록, 문제 성분 재계산을 한 번에 처리한다.
    public DislikedProductCreateResponse createDislikedProduct(
        Long userId,
        DislikedProductCreateRequest request
    ) {
        // 인증 주체에서 받은 userId 기준으로 실제 사용자가 존재하는지 확인한다.
        // 없으면 Service에서 CustomException을 던지고, 공통 예외 처리기가 404 응답으로 바꾼다.
        User user = findUser(userId);

        Long productId = request.productId();

        // 프론트는 productId만 보내므로 실DB의 products.product_id 존재 여부를 직접 확인한다.
        if (myDislikeProductRepository.countProductByProductId(productId) == 0) {
            throw new CustomException(ErrorCode.COSMETICS_NOT_FOUND);
        }

        // 같은 유저가 같은 상품을 여러 번 등록하지 못하게 막는다.
        // 이 예외도 Service에서 던지고, GlobalExceptionHandler가 409 응답으로 변환한다.
        if (myDislikeProductRepository.countDislikedProductByUserIdAndProductId(userId, productId) > 0) {
            throw new CustomException(ErrorCode.ALREADY_DISLIKED_PRODUCT);
        }

        Long dislikedProductId;
        try {
            myDislikeProductRepository.insertDislikedProduct(userId, productId);
        } catch (DataIntegrityViolationException exception) {
            throw new CustomException(ErrorCode.ALREADY_DISLIKED_PRODUCT);
        }

        dislikedProductId = myDislikeProductRepository.findDislikedProductIdByUserIdAndProductId(userId, productId)
            .orElseThrow(() -> new CustomException(ErrorCode.INTERNAL_SERVER_ERROR));

        // 비적합 제품 저장 후 알레르기 유발 성분 목록을 갱신한다.
        syncAvoidIngredients(user);

        // 프론트가 이후 목록 조회/삭제에 쓸 수 있도록 생성된 PK를 반환한다.
        return new DislikedProductCreateResponse(dislikedProductId);
    }

    // 공통 사용자 검증 로직이다. 토큰 userId가 실제 users 테이블에 있는지 확인한다.
    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    // 현재 사용자가 등록한 모든 안 맞는 제품을 기준으로 my_avoid_contri를 전체 재생성한다.
    private void syncAvoidIngredients(User user) {
        // 현재 유저의 비적합 제품 전체를 기준으로 알레르기 유발 성분 ID 집합을 다시 만든다.
        // 등록/삭제 시점마다 재계산해서 MyAvoidContri를 최신 상태로 유지한다.
        Set<Long> allergenIngredientIds = extractAllergenIngredientIds(user.getId());

        // 재계산 결과로 덮어쓰는 방식이라 기존 데이터는 먼저 비운다.
        myAvoidContriRepository.deleteAllByUser_Id(user.getId());
        myAvoidContriRepository.flush();

        if (allergenIngredientIds.isEmpty()) {
            return;
        }

        // ingredient_id 기반으로만 저장하고, 표시값은 조회 시 Ingredient를 join해서 가져온다.
        List<MyAvoidContri> avoidContris = ingredientRepository.findAllById(allergenIngredientIds).stream()
            .map(ingredient -> MyAvoidContri.builder()
                .user(user)
                .ingredient(ingredient)
                .build())
            .toList();

        myAvoidContriRepository.saveAll(avoidContris);
    }

    // product_ingredients 문자열에서 성분명을 뽑아 Ingredient 테이블과 매칭할 ID 집합으로 바꾼다.
    private Set<Long> extractAllergenIngredientIds(Long userId) {
        Set<String> namesForLookup = new HashSet<>();

        for (Long productId : myDislikeProductRepository.findProductIdsByUserId(userId)) {
            // 실DB 스키마 기준으로 product_ingredients 테이블에서 최근 전성분 문자열을 읽는다.
            MyDislikeProductRepository.ProductIngredientTextRow ingredientTexts = myDislikeProductRepository
                .findIngredientTextsByProductId(productId)
                .orElse(null);

            if (ingredientTexts == null) {
                continue;
            }

            namesForLookup.addAll(splitIngredients(ingredientTexts.getProductIngredientsKo()));
            namesForLookup.addAll(splitIngredients(ingredientTexts.getProductIngredientsEn()));
        }

        if (namesForLookup.isEmpty()) {
            return Set.of();
        }

        return ingredientRepository.findAllByNames(namesForLookup).stream()
            // 현재 정책은 hasAllergen = true 인 성분만 문제 성분으로 저장한다.
            .filter(ingredient -> Boolean.TRUE.equals(ingredient.getHasAllergen()))
            .map(Ingredient::getIngredientId)
            .collect(java.util.stream.Collectors.toSet());
    }

    // "'A','B','C'" 형태의 전성분 문자열을 ["A", "B", "C"] 목록으로 바꾸는 파서다.
    private List<String> splitIngredients(String raw) {
        // "'정제수','향료','판테놀'" 형태의 문자열을 개별 성분명 목록으로 분리한다.
        if (raw == null || raw.isBlank()) {
            return List.of();
        }

        String normalized = raw.trim();
        if (normalized.startsWith("'") && normalized.endsWith("'") && normalized.length() >= 2) {
            normalized = normalized.substring(1, normalized.length() - 1);
        }

        return Arrays.stream(normalized.split("'\\s*,\\s*'"))
            .map(String::trim)
            .map(s -> s.replaceAll("^'+|'+$", ""))
            .filter(s -> !s.isBlank())
            .toList();
    }
}

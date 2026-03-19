package com.piview.backend.user.disliked.service;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.product.catalog.repository.IngredientRepository;
import com.piview.backend.product.catalog.repository.ProductIngredientRepository;
import com.piview.backend.product.catalog.repository.ProductRepository;
import com.piview.backend.product.entity.Ingredient;
import com.piview.backend.product.entity.Product;
import com.piview.backend.product.entity.ProductIngredients;
import com.piview.backend.user.disliked.dto.request.DislikedProductCreateRequest;
import com.piview.backend.user.disliked.dto.response.DislikedProductCreateResponse;
import com.piview.backend.user.disliked.dto.response.DislikedIngredientSummaryResponse;
import com.piview.backend.user.disliked.dto.response.DislikedProductSummaryResponse;
import com.piview.backend.user.disliked.entity.MyAvoidContri;
import com.piview.backend.user.disliked.entity.MyDislikeProduct;
import com.piview.backend.user.disliked.repository.MyAvoidContriRepository;
import com.piview.backend.user.disliked.repository.MyDislikeProductRepository;
import com.piview.backend.user.entity.User;
import com.piview.backend.user.repository.UserRepository;
import java.util.Arrays;
import java.util.Collection;
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
    private final ProductRepository productRepository;
    private final ProductIngredientRepository productIngredientRepository;
    private final IngredientRepository ingredientRepository;

    public List<DislikedProductSummaryResponse> getDislikedProducts(Long userId) {
        // 토큰에 담긴 사용자가 실제로 존재하는지 먼저 확인한다.
        findUser(userId);

        // 상품, 브랜드, 이미지까지 fetch join으로 함께 읽어 목록 응답으로 변환한다.
        return myDislikeProductRepository.findAllByUserIdWithProduct(userId).stream()
            .map(dislikedProduct -> new DislikedProductSummaryResponse(
                dislikedProduct.getId(),
                dislikedProduct.getProduct().getProductId(),
                dislikedProduct.getProduct().getName(),
                dislikedProduct.getProduct().getBrand() != null
                    ? dislikedProduct.getProduct().getBrand().getBrandName()
                    : null,
                dislikedProduct.getProduct().getCategory() != null
                    ? dislikedProduct.getProduct().getCategory().getCategoryName()
                    : null,
                dislikedProduct.getProduct().getImage() != null
                    ? dislikedProduct.getProduct().getImage().getUrl()
                    : null,
                dislikedProduct.getProduct().getVolume(),
                dislikedProduct.getProduct().getPrice(),
                dislikedProduct.getProduct().getTopSkinType() != null
                    ? dislikedProduct.getProduct().getTopSkinType().name()
                    : null,
                dislikedProduct.getProduct().getTop2SkinType() != null
                    ? dislikedProduct.getProduct().getTop2SkinType().name()
                    : null
            ))
            .toList();
    }

    public List<DislikedIngredientSummaryResponse> getDislikedIngredients(Long userId) {
        // 토큰에 담긴 사용자가 실제로 존재하는지 먼저 확인한다.
        findUser(userId);

        // 저장된 문제 성분을 성분 상세와 함께 응답으로 변환한다.
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
    public void deleteDislikedProduct(Long userId, Long dislikedProductId) {
        // 토큰에 담긴 사용자가 실제로 존재하는지 먼저 확인한다.
        User user = findUser(userId);

        // 삭제할 등록 ID가 현재 로그인 사용자 소유인지 함께 확인한다.
        MyDislikeProduct dislikedProduct = myDislikeProductRepository.findByIdAndUser_Id(dislikedProductId, userId)
            .orElseThrow(() -> new CustomException(ErrorCode.DISLIKED_PRODUCT_NOT_FOUND));

        // 조회가 끝난 엔티티를 그대로 삭제한다.
        myDislikeProductRepository.delete(dislikedProduct);
        myDislikeProductRepository.flush();

        // 남아 있는 비적합 제품 기준으로 문제 성분 목록을 다시 계산한다.
        syncAvoidIngredients(user);
    }

    @Transactional
    public DislikedProductCreateResponse createDislikedProduct(
        Long userId,
        DislikedProductCreateRequest request
    ) {
        // 인증 주체에서 받은 userId 기준으로 실제 사용자가 존재하는지 확인한다.
        // 없으면 Service에서 CustomException을 던지고, 공통 예외 처리기가 404 응답으로 바꾼다.
        User user = findUser(userId);

        // 프론트는 productId만 보내므로 저장 전에 실제 상품 존재 여부를 다시 검증한다.
        // 존재하지 않으면 404 예외로 처리한다.
        Product product = productRepository.findById(request.productId())
            .orElseThrow(() -> new CustomException(ErrorCode.COSMETICS_NOT_FOUND));

        // 같은 유저가 같은 상품을 여러 번 등록하지 못하게 막는다.
        // 이 예외도 Service에서 던지고, GlobalExceptionHandler가 409 응답으로 변환한다.
        if (myDislikeProductRepository.existsByUser_IdAndProduct_ProductId(userId, product.getProductId())) {
            throw new CustomException(ErrorCode.ALREADY_DISLIKED_PRODUCT);
        }

        // 검증이 끝난 뒤에만 엔티티를 만들어 저장한다.
        MyDislikeProduct myDislikeProduct = MyDislikeProduct.builder()
            .user(user)
            .product(product)
            .build();

        // 애플리케이션 레벨 중복 검사 사이에 동시 요청이 들어오면
        // DB unique 제약에서 막힐 수 있으므로 409로 다시 변환한다.
        MyDislikeProduct saved;
        try {
            saved = myDislikeProductRepository.saveAndFlush(myDislikeProduct);
        } catch (DataIntegrityViolationException exception) {
            throw new CustomException(ErrorCode.ALREADY_DISLIKED_PRODUCT);
        }

        // 비적합 제품 저장 후 알레르기 유발 성분 목록을 갱신한다.
        syncAvoidIngredients(user);

        // 프론트가 이후 목록 조회/삭제에 쓸 수 있도록 생성된 PK를 반환한다.
        return new DislikedProductCreateResponse(saved.getId());
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private void syncAvoidIngredients(User user) {
        // 현재 유저의 비적합 제품 전체를 기준으로 알레르기 유발 성분 ID 집합을 다시 만든다.
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

    private Set<Long> extractAllergenIngredientIds(Long userId) {
        Set<String> namesForLookup = new HashSet<>();

        for (MyDislikeProduct dislikedProduct : myDislikeProductRepository.findAllByUser_Id(userId)) {
            ProductIngredients productIngredients = productIngredientRepository
                .findByProductId(dislikedProduct.getProduct().getProductId())
                .orElse(null);

            if (productIngredients == null) {
                continue;
            }

            namesForLookup.addAll(splitIngredients(productIngredients.getProductIngredientsKo()));
            namesForLookup.addAll(splitIngredients(productIngredients.getProductIngredientsEn()));
        }

        if (namesForLookup.isEmpty()) {
            return Set.of();
        }

        return ingredientRepository.findAllByNames(namesForLookup).stream()
            .filter(ingredient -> Boolean.TRUE.equals(ingredient.getHasAllergen()))
            .map(Ingredient::getIngredientId)
            .collect(java.util.stream.Collectors.toSet());
    }

    private List<String> splitIngredients(String raw) {
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

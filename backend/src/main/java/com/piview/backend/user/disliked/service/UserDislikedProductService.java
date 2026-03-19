package com.piview.backend.user.disliked.service;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.product.catalog.repository.ProductRepository;
import com.piview.backend.product.entity.Product;
import com.piview.backend.user.disliked.dto.request.DislikedProductCreateRequest;
import com.piview.backend.user.disliked.dto.response.DislikedProductCreateResponse;
import com.piview.backend.user.disliked.dto.response.DislikedProductSummaryResponse;
import com.piview.backend.user.disliked.entity.MyDislikeProduct;
import com.piview.backend.user.disliked.repository.MyDislikeProductRepository;
import com.piview.backend.user.entity.User;
import com.piview.backend.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserDislikedProductService {

    private final MyDislikeProductRepository myDislikeProductRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

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

        MyDislikeProduct saved = myDislikeProductRepository.save(myDislikeProduct);

        // 프론트가 이후 목록 조회/삭제에 쓸 수 있도록 생성된 PK를 반환한다.
        return new DislikedProductCreateResponse(saved.getId());
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }
}

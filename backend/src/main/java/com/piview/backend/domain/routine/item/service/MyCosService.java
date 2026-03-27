package com.piview.backend.domain.routine.item.service;

import com.piview.backend.domain.product.catalog.dto.ProductSummaryResponse;
import com.piview.backend.domain.product.like.repository.ProductLikeRepository;
import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.domain.product.catalog.repository.ProductRepository;
import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.routine.item.dto.MyCosResponseDto;
import com.piview.backend.domain.routine.item.entity.MyCos;
import com.piview.backend.domain.routine.item.repository.MyCosRepository;
import com.piview.backend.domain.user.login.entity.User;
import com.piview.backend.domain.user.login.repository.UserRepository;
import java.util.HashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MyCosService {

    private final MyCosRepository myCosRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductLikeRepository productLikeRepository;

    // 보유 제품 조회해서 list로 반환
    public List<MyCosResponseDto> getMyCosList(Long userId) {

        // 내 보관함 제품 리스트 가져오기 (Fetch Join 적용된 쿼리 권장)
        List<MyCos> myCosList = myCosRepository.findAllByUserIdWithProduct(userId);

        // 내가 찜한 제품의 productId 목록을 Set으로 가져오기 (N+1 방지)
        // Set을 쓰면 contains() 메서드가 O(1) 성능이라 매우 빠릅니다.
        Set<Long> likedProductIds = new HashSet<>(productLikeRepository.findLikedProductIdsByUserId(userId));

        // 매핑 로직 (N+1 쿼리 없이 매우 빠름)
        return myCosList.stream()
            .map(mc -> {
                Product product = mc.getProduct();

                // 내 찜 목록에 이 제품의 productId가 들어있는지 확인
                boolean isLiked = likedProductIds.contains(product.getProductId());

                ProductSummaryResponse summary = ProductSummaryResponse.from(product, isLiked);

                return new MyCosResponseDto(mc.getId(), summary);
            })
            .toList();
    }


    @Transactional
    public Long saveMyCos(Long userId, Long productId) {

        // 유저 유효성 검사 및 엔티티 조회
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 상품 유효성 검사 및 엔티티 조회
        Product product = productRepository.findByProductId(productId)
            .orElseThrow(() -> new CustomException(ErrorCode.COSMETICS_NOT_FOUND));

        // 중복 저장 방지: 이미 보관함에 있는 상품이면 409 에러 발생
        if (myCosRepository.existsByUserIdAndProductId(userId, product.getProductId())) {
            throw new CustomException(ErrorCode.ALREADY_SAVED_PRODUCT);
        }

        // MyCos 엔티티 조립 후 저장
        MyCos myCos = MyCos.builder()
            .user(user)
            .product(product)
            .build();

        MyCos savedMyCos = myCosRepository.save(myCos);

        // 성공 시 생성된 MyCos의 PK 반환
        return savedMyCos.getId();
    }


    @Transactional
    public void deleteMyCos(Long userId, Long myCosId) {

        MyCos myCos = myCosRepository.findById(myCosId)
            .orElseThrow(() -> new CustomException(ErrorCode.MY_COS_NOT_FOUND));

        // 보안 핵심 (IDOR 방어): 이 제품의 주인이 지금 요청한 유저가 맞는지 확인
        if (!myCos.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        myCosRepository.delete(myCos);
    }
}

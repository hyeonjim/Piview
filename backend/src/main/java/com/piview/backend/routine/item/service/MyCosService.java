package com.piview.backend.routine.item.service;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.product.catalog.repository.ProductSearchRepository;
import com.piview.backend.product.entity.Product;
import com.piview.backend.product.catalog.repository.ProductRepository;
import com.piview.backend.routine.item.dto.MyCosCreateRequestDto;
import com.piview.backend.routine.item.dto.MyCosResponseDto;
import com.piview.backend.routine.item.entity.MyCos;
import com.piview.backend.routine.item.repository.MyCosRepository;
import com.piview.backend.user.entity.User;
import com.piview.backend.user.repository.UserRepository;
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
    private final ProductSearchRepository productSearchRepository;
    // 보유 제품 조회해서 list로 반환
    public List<MyCosResponseDto> getMyCosList(Long userId) {
        // 1. 레포지토리에서 Fetch Join이 적용된 쿼리 호출
        List<MyCos> myCosList = myCosRepository.findAllByUserIdWithProduct(userId);

        // 2. 엔티티 리스트를 Record DTO로 변환
        return myCosList.stream()
                .map(mc -> MyCosResponseDto.builder()
                        .id(mc.getId())
                        .brand(mc.getProduct().getBrand().getBrandName())      // Product -> Brand 접근
                        .productName(mc.getProduct().getName())           // Product 이름
                        .category(mc.getProduct().getCategory().getCategoryName()) // Product -> Category 접근
                        .imageUrl(mc.getProduct().getImage().getUrl()) // Product -> Image 접근
                        .build())
                .toList(); // Stream을 List로 변환
    }

    @Transactional
    public Long saveMyCos(Long userId, MyCosCreateRequestDto requestDto) {

        // 유저 유효성 검사 및 엔티티 조회
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 상품 유효성 검사 및 엔티티 조회
        Product product = productSearchRepository.findById(requestDto.productId())
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

        // 지우려는 MyCos 데이터를 찾기
        MyCos myCos = myCosRepository.findById(myCosId)
            .orElseThrow(() -> new CustomException(ErrorCode.MY_COS_NOT_FOUND));

        // 보안 핵심 (IDOR 방어): 이 제품의 주인이 지금 요청한 유저가 맞는지 확인
        if (!myCos.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        myCosRepository.delete(myCos);
    }
}
package com.piview.backend.routine.item.service;

import com.piview.backend.routine.item.dto.MyCosResponseDto;
import com.piview.backend.routine.item.entity.MyCos;
import com.piview.backend.routine.item.repository.MyCosRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MyCosService {

    private final MyCosRepository myCosRepository;

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
}
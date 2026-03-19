package com.piview.backend.routine.core.service;

import com.piview.backend.global.exception.CustomException;
import com.piview.backend.global.exception.ErrorCode;
import com.piview.backend.product.catalog.dto.ProductSummaryResponse;
import com.piview.backend.product.catalog.repository.ProductRepository;
import com.piview.backend.product.entity.Product;
import com.piview.backend.product.like.repository.ProductLikeRepository;
import com.piview.backend.routine.core.dto.*;
import com.piview.backend.routine.core.entity.MyRoutine;
import com.piview.backend.routine.core.entity.RoutineColumn;
import com.piview.backend.routine.core.entity.RoutineDetail;
import com.piview.backend.routine.core.repository.RoutineColumnRepository;
import com.piview.backend.routine.core.repository.RoutineRepository;
import java.util.ArrayList;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoutineService {

  private final RoutineRepository routineRepository;
  private final RoutineColumnRepository routineColumnRepository;
  private final ProductRepository productRepository;
  private final ProductLikeRepository productLikeRepository;
  private final RedisDraftService redisDraftService;

  // 제품을 루틴(redis)에 추가
  @Transactional(readOnly = true) // DB에서 Product만 조회하므로 readOnly
  public void addProductToDraft(Long userId, AddDraftItemRequest request) {
    // 기존 장바구니 리스트 불러오기
    List<DraftItemDto> currentDraft = new ArrayList<>(redisDraftService.getDraftItems(userId));

    // 추가할 상품 정보 DB에서 조회
    Product product = productRepository.findById(request.productId())
        .orElseThrow(() -> new CustomException(ErrorCode.COSMETICS_NOT_FOUND));

    // 새로운 stepOrder 계산 (현재 장바구니에 있는 stepOrder 중 가장 큰 값 + 1)
    int nextOrder = currentDraft.stream()
        .mapToInt(DraftItemDto::stepOrder)
        .max()
        .orElse(0) + 1; // 장바구니가 비어있으면 1부터 시작

    boolean isLiked = productLikeRepository.findByUserIdAndProductId(userId, product.getProductId()).isPresent();

    // 새로운 DraftItemDto 생성 및 리스트에 추가
    DraftItemDto newItem = new DraftItemDto(
        request.columnId(),
        nextOrder,
        ProductSummaryResponse.from(product, isLiked)
    );
    currentDraft.add(newItem);

    // 업데이트된 리스트를 다시 Redis에 저장
    redisDraftService.saveDraftItems(userId, currentDraft);
  }

  // 제품을 루틴(redis)에서 삭제
  public void removeProductFromDraft(Long userId, Long productId) {
    // 기존 장바구니 불러오기
    List<DraftItemDto> currentDraft = redisDraftService.getDraftItems(userId);

    if (currentDraft == null || currentDraft.isEmpty()) {
      return; // 장바구니가 비어있으면 무시
    }

    // 삭제하려는 productId와 일치하지 않는 제품들만 남기기 (필터링)
    List<DraftItemDto> updatedDraft = currentDraft.stream()
        .filter(item -> !item.product().getProductId().equals(productId))
        .toList();

    // 업데이트된 리스트를 다시 Redis에 저장 (해당 제품만 쏙 빠진 채로 덮어쓰기)
    redisDraftService.saveDraftItems(userId, updatedDraft);
  }

  // 루틴 생성 및 저장
  @Transactional
  public Long createRoutine(Long userId, String title) {
    long routineCount = routineRepository.countByUserId(userId);
    if (routineCount >= 6) {
      throw new CustomException(ErrorCode.ROUTINE_LIMIT_EXCEEDED);
    }

    // redis에서 임시 루틴 데이터 불러오기
    List<DraftItemDto> draftItems = redisDraftService.getDraftItems(userId);

    if (draftItems == null || draftItems.isEmpty()) {
      throw new CustomException(ErrorCode.EMPTY_ROUTINE_DRAFT);
    }

    MyRoutine routine = MyRoutine.builder()
        .userId(userId)
        .title(title)
        .isMain(routineCount == 0) // 첫 루틴이면 자동으로 메인
        .build();

    List<Integer> columnIds = draftItems.stream().map(DraftItemDto::columnId).toList();
    List<Long> productIds = draftItems.stream().map(item -> item.product().getProductId()).toList();

    // 조회한 엔티티를 Map으로 변환하여 O(1) 성능으로 매칭 준비
    Map<Integer, RoutineColumn> columnMap = routineColumnRepository.findAllById(columnIds).stream()
        .collect(Collectors.toMap(RoutineColumn::getId, c -> c));
    Map<Long, Product> productMap = productRepository.findAllById(productIds).stream()
        .collect(Collectors.toMap(Product::getProductId, p -> p));

    for (DraftItemDto item : draftItems) {
      // 최적화: DB 쿼리를 날리지 않고 메모리(Map)에서 즉시 꺼내옴
      RoutineColumn column = columnMap.get(item.columnId());
      Product product = productMap.get(item.product().getProductId());

      if (column == null) {
        throw new CustomException(ErrorCode.ROUTINE_COLUMN_NOT_FOUND);
      }
      if (product == null) {
        throw new CustomException(ErrorCode.COSMETICS_NOT_FOUND);
      }

      RoutineDetail detail = RoutineDetail.builder()
          .myRoutine(routine)
          .routineColumn(column)
          .product(product)
          .stepOrder(item.stepOrder())
          .build();

      routine.getDetails().add(detail);
    }

    MyRoutine savedRoutine = routineRepository.save(routine);
    redisDraftService.clearDraft(userId);

    return savedRoutine.getId();
  }

  // 메인 루틴 변경
  @Transactional
  public void setMainRoutine(Long userId, Long targetRoutineId) {
    routineRepository.updateIsMainFalseByUserId(userId); // 벌크 연산

    MyRoutine targetRoutine = routineRepository.findByIdWithDetails(targetRoutineId)
        .orElseThrow(() -> new CustomException(ErrorCode.ROUTINE_NOT_FOUND));

    targetRoutine.changeMainStatus(true);
  }

  // 루틴 전체 목록 조회
  public List<RoutineListResponse> getUserRoutines(Long userId) {
    return routineRepository.findRoutineListByUserId(userId);
  }

  // 메인 루틴 조회
  public RoutineResponse getMainRoutine(Long userId) {
    MyRoutine mainRoutine = routineRepository.findByUserIdAndIsMainTrue(userId)
        .orElseThrow(() -> new CustomException(ErrorCode.MAIN_ROUTINE_NOT_FOUND));

    if (!mainRoutine.getUserId().equals(userId)) {
      throw new CustomException(ErrorCode.ACCESS_DENIED);
    }

    return convertToRoutineResponse(mainRoutine, userId);
  }

  // 루틴 상세 조회
  public RoutineResponse getRoutineDetails(Long userId, Long routineId) {
    MyRoutine routine = routineRepository.findByIdWithDetails(routineId)
        .orElseThrow(() -> new CustomException(ErrorCode.ROUTINE_NOT_FOUND));

    if (!routine.getUserId().equals(userId)) {
      throw new CustomException(ErrorCode.ACCESS_DENIED);
    }

    return convertToRoutineResponse(routine, userId);
  }

  // 공통 DTO 변환 로직
  private RoutineResponse convertToRoutineResponse(MyRoutine routine, Long userId) {
    List<Long> likedProductIds = productLikeRepository.findLikedProductIdsByUserId(userId);

    Map<RoutineColumn, List<RoutineDetail>> groupedDetails = routine.getDetails().stream()
        .collect(Collectors.groupingBy(RoutineDetail::getRoutineColumn));

    List<RoutineStepGroupDto> stepGroups = groupedDetails.entrySet().stream()
        .map(entry -> {
          RoutineColumn column = entry.getKey();
          List<RoutineProductDto> products = entry.getValue().stream()
              .sorted(Comparator.comparing(RoutineDetail::getStepOrder)) // 순서대로 정렬
              .map(detail -> {
                // 내 찜 목록에 이 화장품 ID가 있는지 확인
                boolean isLiked = likedProductIds.contains(detail.getProduct().getProductId());

                return new RoutineProductDto(
                    detail.getId(),
                    detail.getStepOrder(),
                    ProductSummaryResponse.from(detail.getProduct(), isLiked)
                );
              })
              .toList();

          return new RoutineStepGroupDto(column.getId(), column.getName(), products);
        })
        .sorted(Comparator.comparing(RoutineStepGroupDto::columnId)) // 컬럼 ID 순서대로 정렬
        .toList();

    return new RoutineResponse(routine.getId(), routine.getTitle(), routine.isMain(), stepGroups);
  }

  // 루틴 순서 변경
  @Transactional
  public void updateRoutineOrders(Long userId, Long routineId, RoutineOrderUpdateRequest request) {
    // 해당 루틴이 본인 소유가 맞는지 검증
    MyRoutine routine = routineRepository.findByIdWithDetails(routineId)
        .orElseThrow(() -> new CustomException(ErrorCode.ROUTINE_NOT_FOUND));

    if (!routine.getUserId().equals(userId)) {
      throw new CustomException(ErrorCode.ACCESS_DENIED);
    }

    // 요청받은 ID 목록을 Map으로 변환하여 매칭 속도 향상 (routineDetailId -> stepOrder)
    Map<Long, Integer> orderMap = request.updatedOrders().stream()
        .collect(Collectors.toMap(
            RoutineDetailOrderDto::routineDetailId,
            RoutineDetailOrderDto::stepOrder
        ));

    // 루틴에 속한 상세 항목들을 순회하며 순서 업데이트 (더티 체킹 발생)
    routine.getDetails().forEach(detail -> {
      Integer newOrder = orderMap.get(detail.getId());
      if (newOrder != null) {
        detail.updateStepOrder(newOrder);
      }
    });
  }

  // 루틴 삭제
  @Transactional
  public void deleteRoutine(Long userId, Long routineId) {
    // 루틴 조회
    MyRoutine routine = routineRepository.findByIdWithDetails(routineId)
        .orElseThrow(() -> new CustomException(ErrorCode.ACCESS_DENIED));


    // 권한 검증
    if (!routine.getUserId().equals(userId)) {
      throw new IllegalArgumentException("본인의 루틴만 삭제할 수 있습니다.");
    }

    // 삭제하려는 루틴이 메인 루틴인지 기억해둠
    boolean wasMain = routine.isMain();

    // 루틴 삭제 (Cascade 옵션에 의해 연관된 RoutineDetail도 모두 삭제됨)
    routineRepository.delete(routine);

    // 플러시를 강제로 호출하여 DB에 DELETE 쿼리를 먼저 반영합니다. (남은 루틴을 정확히 조회하기 위함)
    routineRepository.flush();

    // 만약 삭제된 것이 메인 루틴이었다면, 남은 루틴 중 하나를 메인으로 자동 설정
    if (wasMain) {
      routineRepository.findFirstByUserIdOrderByIdDesc(userId)
          .ifPresent(newMain -> newMain.changeMainStatus(true));
    }
  }
}

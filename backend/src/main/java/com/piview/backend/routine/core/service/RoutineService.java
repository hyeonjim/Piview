package com.piview.backend.routine.core.service;

import com.piview.backend.routine.core.dto.*;
import com.piview.backend.routine.core.entity.MyRoutine;
import com.piview.backend.routine.core.entity.RoutineColumn;
import com.piview.backend.routine.core.entity.RoutineDetail;
import com.piview.backend.routine.core.repository.RoutineRepository;
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

  // 루틴 생성 및 저장
  @Transactional
  public Long createRoutine(Long userId, String title) {
    long routineCount = routineRepository.countByUserId(userId);
    if (routineCount >= 6) {
      throw new IllegalStateException("루틴은 최대 6개까지만 생성할 수 있습니다.");
    }

    MyRoutine routine = MyRoutine.builder()
        .userId(userId)
        .title(title)
        .isMain(routineCount == 0) // 첫 루틴이면 자동으로 메인
        .build();

    return routineRepository.save(routine).getId();
  }

  // 메인 루틴 변경
  @Transactional
  public void setMainRoutine(Long userId, Long targetRoutineId) {
    routineRepository.updateIsMainFalseByUserId(userId); // 벌크 연산

    MyRoutine targetRoutine = routineRepository.findById(targetRoutineId)
        .orElseThrow(() -> new IllegalArgumentException("루틴을 찾을 수 없습니다."));

    targetRoutine.changeMainStatus(true);
  }

  // 루틴 상세 조회
  public RoutineResponse getRoutineDetails(Long userId, Long routineId) {
    MyRoutine routine = routineRepository.findById(routineId)
        .orElseThrow(() -> new IllegalArgumentException("루틴을 찾을 수 없습니다."));

    if (!routine.getUserId().equals(userId)) {
      throw new IllegalArgumentException("본인의 루틴만 조회할 수 있습니다.");
    }

    // 단계(RoutineColumn)별로 데이터를 그룹핑
    Map<RoutineColumn, List<RoutineDetail>> groupedDetails = routine.getDetails().stream()
        .collect(Collectors.groupingBy(RoutineDetail::getRoutineColumn));

    List<RoutineStepGroupDto> stepGroups = groupedDetails.entrySet().stream()
        .map(entry -> {
          RoutineColumn column = entry.getKey();
          List<RoutineProductDto> products = entry.getValue().stream()
              .sorted(Comparator.comparing(RoutineDetail::getStepOrder)) // 순서대로 정렬
              .map(detail -> new RoutineProductDto(
                  detail.getId(),
                  detail.getProduct().getProductId(),
                  detail.getStepOrder()
              ))
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
    MyRoutine routine = routineRepository.findById(routineId)
        .orElseThrow(() -> new IllegalArgumentException("루틴을 찾을 수 없습니다."));

    if (!routine.getUserId().equals(userId)) {
      throw new IllegalArgumentException("본인의 루틴만 수정할 수 있습니다.");
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
    MyRoutine routine = routineRepository.findById(routineId)
        .orElseThrow(() -> new IllegalArgumentException("루틴을 찾을 수 없습니다."));

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

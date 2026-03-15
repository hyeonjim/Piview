package com.piview.backend.routine.core.service;

import com.piview.backend.routine.core.dto.RoutineProductDto;
import com.piview.backend.routine.core.dto.RoutineResponse;
import com.piview.backend.routine.core.dto.RoutineStepGroupDto;
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

  // 루틴 상세 조회
  public RoutineResponse getRoutineDetails(Long routineId) {
    MyRoutine routine = routineRepository.findById(routineId)
        .orElseThrow(() -> new IllegalArgumentException("루틴을 찾을 수 없습니다."));

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
                  detail.getProductId().getProductId(),
                  detail.getStepOrder()
              ))
              .toList();

          return new RoutineStepGroupDto(column.getId(), column.getName(), products);
        })
        .sorted(Comparator.comparing(RoutineStepGroupDto::columnId)) // 컬럼 ID 순서대로 정렬
        .toList();

    return new RoutineResponse(routine.getId(), routine.getTitle(), routine.isMain(), stepGroups);
  }
}

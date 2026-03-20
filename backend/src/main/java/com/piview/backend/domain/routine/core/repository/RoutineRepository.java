package com.piview.backend.domain.routine.core.repository;


import com.piview.backend.domain.routine.core.dto.RoutineListResponse;
import com.piview.backend.domain.routine.core.entity.MyRoutine;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;


public interface RoutineRepository extends JpaRepository<MyRoutine, Long> {

  long countByUserId(Long userId);

  // 벌크 연산
  @Modifying(clearAutomatically = true)
  @Query("UPDATE MyRoutine r SET r.isMain = false WHERE r.userId = :userId")
  void updateIsMainFalseByUserId(@Param("userId") Long userId);

  // 가장 최근에 생성된 루틴 하나 조회
  Optional<MyRoutine> findFirstByUserIdOrderByIdDesc(Long userId);

  // 사용자의 모든 루틴 리스트 조회
  List<MyRoutine> findAllByUserId(Long userId);

  @Query("SELECT new com.piview.backend.domain.routine.core.dto.RoutineListResponse(" +
      "r.id, r.title, r.isMain, CAST(COUNT(rd.id) AS int)) " +
      "FROM MyRoutine r LEFT JOIN r.details rd " +
      "WHERE r.userId = :userId " +
      "GROUP BY r.id, r.title, r.isMain")
  List<RoutineListResponse> findRoutineListByUserId(@Param("userId") Long userId);

  // 사용자의 메인 루틴 찾기
  @EntityGraph(attributePaths = {"details", "details.routineColumn", "details.product"})
  Optional<MyRoutine> findByUserIdAndIsMainTrue(Long userId);

  // JOIN FETCH를 통해 Routine, RoutineDetail, Product, Brand, Category, Image 등을 한 번에 가져옴
  @Query("SELECT r FROM MyRoutine r " +
      "JOIN FETCH r.details rd " +
      "JOIN FETCH rd.routineColumn " +
      "JOIN FETCH rd.product p " +
      "LEFT JOIN FETCH p.brand " +
      "LEFT JOIN FETCH p.category " +
      "WHERE r.id = :routineId")
  Optional<MyRoutine> findByIdWithDetails(@Param("routineId") Long routineId);

}

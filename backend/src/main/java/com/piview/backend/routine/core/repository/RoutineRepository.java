package com.piview.backend.routine.core.repository;


import com.piview.backend.routine.core.entity.MyRoutine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


public interface RoutineRepository extends JpaRepository<MyRoutine, Long> {

  long countByUserId(Long userId);

  // 벌크 연산
  @Modifying
  @Query("UPDATE MyRoutine r SET r.isMain = false WHERE r.userId = :userId")
  void updateIsMainFalseByUserId(@Param("userId") Long userId);

}

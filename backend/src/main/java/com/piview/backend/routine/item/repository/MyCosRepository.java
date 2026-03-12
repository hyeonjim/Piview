package com.piview.backend.routine.item.repository;

import com.piview.backend.routine.item.entity.MyCos;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MyCosRepository extends JpaRepository<MyCos, Long> {

    // Fetch Join: MyCos -> Product -> Brand & Image까지 한 번에 쿼리 1번으로 가져오기
    @Query("SELECT m FROM MyCos m " +
            "JOIN FETCH m.product p " +
            "JOIN FETCH p.brand " +
            "JOIN FETCH p.image " +
            "WHERE m.user.id = :userId")
    List<MyCos> findAllByUserIdWithProduct(@Param("userId") Long userId);
}
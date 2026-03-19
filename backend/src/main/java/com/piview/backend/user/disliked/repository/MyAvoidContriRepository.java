package com.piview.backend.user.disliked.repository;

import com.piview.backend.user.disliked.entity.MyAvoidContri;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MyAvoidContriRepository extends JpaRepository<MyAvoidContri, Long> {

    // 문제 성분 목록 조회 시 성분 엔티티까지 함께 가져온다.
    @Query("SELECT mac FROM MyAvoidContri mac "
        + "JOIN FETCH mac.ingredient i "
        + "WHERE mac.user.id = :userId "
        + "ORDER BY COALESCE(i.nameKo, i.nameEn) ASC")
    List<MyAvoidContri> findAllByUserIdWithIngredient(@Param("userId") Long userId);

    // 재계산 전에 해당 사용자의 기존 문제 성분을 전부 비운다.
    @Modifying
    void deleteAllByUser_Id(Long userId);
}

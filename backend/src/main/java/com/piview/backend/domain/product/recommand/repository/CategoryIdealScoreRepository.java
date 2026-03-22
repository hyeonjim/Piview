package com.piview.backend.domain.product.recommand.repository;

import com.piview.backend.domain.product.entity.CategoryIdealScore;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryIdealScoreRepository extends JpaRepository<CategoryIdealScore, String> {

    // 유저의 피부타입과 추천받을 스텝(예: 3 = 스킨/토너/패드/미스트)을 넘겨서 이상치를 가져옴.
    CategoryIdealScore findBySkinTypeAndRoutineColId(String skinType, String routineColId);
}

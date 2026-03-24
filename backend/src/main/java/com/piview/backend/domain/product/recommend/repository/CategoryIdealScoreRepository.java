package com.piview.backend.domain.product.recommend.repository;

import com.piview.backend.domain.product.entity.CategoryIdealScore;
import com.piview.backend.domain.skin.common.SkinTypeEnum;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryIdealScoreRepository extends JpaRepository<CategoryIdealScore, Long> {

    // 유저의 피부타입과 추천받을 스텝(예: 3 = 스킨/토너/패드/미스트)을 넘겨서 이상치를 가져옴.
    CategoryIdealScore findBySkinTypeAndRoutineColId(SkinTypeEnum skinType, Long routineColId);
}

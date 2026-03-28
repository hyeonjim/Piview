package com.piview.backend.domain.product.recommend.repository;

import com.piview.backend.domain.product.entity.CategoryIdealScore;
import com.piview.backend.domain.skin.common.SkinTypeEnum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryIdealScoreRepository extends JpaRepository<CategoryIdealScore, Long> {

    // 유저의 피부타입과 추천받을 스텝(예: 3 = 스킨/토너/패드/미스트)을 넘겨서 이상치를 가져옴.
    CategoryIdealScore findBySkinTypeAndRoutineColId(SkinTypeEnum skinType, Long routineColId);

    // 루틴 분석용 - 여러 routineColId를 한번에 조회 (N+1 방지)
    List<CategoryIdealScore> findBySkinTypeAndRoutineColIdIn(SkinTypeEnum skinType, List<Long> routineColIds);
}

package com.piview.backend.domain.product.recommand.service;

import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.product.recommand.dto.RoutineContextDto;
import org.springframework.stereotype.Component;

@Component
public class RoutineConflictChecker {

    /**
     * 사용자의 현재 '루틴 전체 상태(RoutineContext)'와 '추천 후보 제품(Candidate)' 간의
     * 성분 충돌 패널티 점수를 계산하여 반환합니다.
     */
    public double calculateConflictPenalty(RoutineContextDto routine, Product candidate) {
        double penalty = 0.0;

        // C001: 레티놀 vs 산성 각질제거제 (-200)
        if (isConflict(routine.isHasRetinol(), candidate.getHasAcid(),
                routine.isHasAcid(), candidate.getHasRetinol())) {
            penalty -= 200.0;
        }

        // C002: 레티놀 vs 순수 비타민C (-200)
        if (isConflict(routine.isHasRetinol(), candidate.getHasPureVitC(),
                routine.isHasPureVitC(), candidate.getHasRetinol())) {
            penalty -= 200.0;
        }

        // C003: 산성 각질제거제 vs 순수 비타민C (-200)
        if (isConflict(routine.isHasAcid(), candidate.getHasPureVitC(),
                routine.isHasPureVitC(), candidate.getHasAcid())) {
            penalty -= 200.0;
        }

        // C004: 구리 펩타이드 vs 강산성(AHA/BHA 또는 순수 비타민C) (-100)
        boolean routineHasStrongAcid = routine.isHasAcid() || routine.isHasPureVitC();
        boolean candidateHasStrongAcid = candidate.getHasAcid() || candidate.getHasPureVitC();
        if (isConflict(routine.isHasCopperPep(), candidateHasStrongAcid,
                routineHasStrongAcid, candidate.getHasCopperPep())) {
            penalty -= 100.0;
        }

        // C005 & C008: 나이아신아마이드 vs 강산성(순수 비타민C 또는 AHA/BHA) (-100)
        if (isConflict(routine.isHasNiacinamide(), candidateHasStrongAcid,
                routineHasStrongAcid, candidate.getHasNiacinamide())) {
            penalty -= 100.0;
        }

        // C006: 여드름 연고(벤조일) vs 레티놀/순수 비타민C (-200)
        boolean routineHasAntiox = routine.isHasRetinol() || routine.isHasPureVitC();
        boolean candidateHasAntiox = candidate.getHasRetinol() || candidate.getHasPureVitC();
        if (isConflict(routine.isHasBenzoyl(), candidateHasAntiox,
                routineHasAntiox, candidate.getHasBenzoyl())) {
            penalty -= 200.0;
        }

        // C007: 산성 각질제거제 vs 여드름 연고(벤조일) (-200)
        if (isConflict(routine.isHasAcid(), candidate.getHasBenzoyl(),
                routine.isHasBenzoyl(), candidate.getHasAcid())) {
            penalty -= 200.0;
        }

        // C009: 단백질/EGF vs 강산성(AHA/BHA/순수 비타민C) 변성 위험 (-150)
        if (isConflict(routine.isHasProtein(), candidateHasStrongAcid,
                routineHasStrongAcid, candidate.getHasProtein())) {
            penalty -= 150.0;
        }

        // C010: 알부틴 vs 강산성(독성 변환 위험) (-150)
        if (isConflict(routine.isHasArbutin(), candidateHasStrongAcid,
                routineHasStrongAcid, candidate.getHasArbutin())) {
            penalty -= 150.0;
        }

        return penalty;
    }

    /**
     * 양방향 교차 충돌 확인 헬퍼 (A에 있고 B에 있거나, B에 있고 A에 있거나)
     */
    private boolean isConflict(boolean routineHasA, boolean candidateHasB,
                               boolean routineHasB, boolean candidateHasA) {
        return (routineHasA && candidateHasB) || (routineHasB && candidateHasA);
    }
}


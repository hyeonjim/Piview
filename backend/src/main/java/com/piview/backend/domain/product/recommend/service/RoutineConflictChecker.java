package com.piview.backend.domain.product.recommend.service;

import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.product.recommend.dto.RoutineContextDto;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

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
     * 두 제품 간의 구체적인 성분 충돌 내용을 리스트로 반환합니다.
     */
    public List<String> checkPairwiseConflict(Product p1, Product p2) {
        List<String> details = new ArrayList<>();
        String name1 = p1.getName();
        String name2 = p2.getName();

        // C001: 레티놀 vs 산성 각질제거제
        if (isConflict(p1.getHasRetinol(), p2.getHasAcid(), p1.getHasAcid(), p2.getHasRetinol())) {
            details.add(String.format("[%s]의 레티놀 성분과 [%s]의 산성 각질제거제(AHA/BHA)는 함께 사용하면 피부에 강한 자극을 줄 수 있습니다.",
                Boolean.TRUE.equals(p1.getHasRetinol()) ? name1 : name2,
                Boolean.TRUE.equals(p1.getHasAcid()) ? name1 : name2));
        }

        // C002: 레티놀 vs 순수 비타민C
        if (isConflict(p1.getHasRetinol(), p2.getHasPureVitC(), p1.getHasPureVitC(), p2.getHasRetinol())) {
            details.add(String.format("[%s]의 레티놀 성분과 [%s]의 순수 비타민C는 함께 사용하면 피부 자극이 심해질 수 있으니 주의하세요",
                Boolean.TRUE.equals(p1.getHasRetinol()) ? name1 : name2,
                Boolean.TRUE.equals(p1.getHasPureVitC()) ? name1 : name2));
        }

        // C003: 산성 각질제거제 vs 순수 비타민C
        if (isConflict(p1.getHasAcid(), p2.getHasPureVitC(), p1.getHasPureVitC(), p2.getHasAcid())) {
            details.add(String.format("[%s]의 산성 각질제거제 성분과 [%s]의 순수 비타민C를 동시에 사용하면 피부 장벽에 부담을 줄 수 있습니다.",
                Boolean.TRUE.equals(p1.getHasAcid()) ? name1 : name2,
                Boolean.TRUE.equals(p1.getHasPureVitC()) ? name1 : name2));
        }

        // C004: 구리 펩타이드 vs 강산성
        boolean p1HasStrongAcid = Boolean.TRUE.equals(p1.getHasAcid()) || Boolean.TRUE.equals(p1.getHasPureVitC());
        boolean p2HasStrongAcid = Boolean.TRUE.equals(p2.getHasAcid()) || Boolean.TRUE.equals(p2.getHasPureVitC());
        if (isConflict(p1.getHasCopperPep(), p2HasStrongAcid, p1HasStrongAcid, p2.getHasCopperPep())) {
            details.add(String.format("[%s]의 구리 펩타이드 성분과 [%s]의 강산성 성분(AHA/BHA/비타민C)을 함께 사용하면 성분이 변성될 위험이 있습니다.",
                Boolean.TRUE.equals(p1.getHasCopperPep()) ? name1 : name2,
                p1HasStrongAcid ? name1 : name2));
        }

        // C005 & C008: 나이아신아마이드 vs 강산성
        if (isConflict(p1.getHasNiacinamide(), p2HasStrongAcid, p1HasStrongAcid, p2.getHasNiacinamide())) {
            details.add(String.format("[%s]의 나이아신아마이드 성분과 [%s]의 강산성 성분을 함께 사용하면 피부 자극을 유발할 수 있습니다.",
                Boolean.TRUE.equals(p1.getHasNiacinamide()) ? name1 : name2,
                p1HasStrongAcid ? name1 : name2));
        }

        // C006: 벤조일 vs 항산화(레티놀/순수비타민C)
        boolean p1HasAntiox = Boolean.TRUE.equals(p1.getHasRetinol()) || Boolean.TRUE.equals(p1.getHasPureVitC());
        boolean p2HasAntiox = Boolean.TRUE.equals(p2.getHasRetinol()) || Boolean.TRUE.equals(p2.getHasPureVitC());
        if (isConflict(p1.getHasBenzoyl(), p2HasAntiox, p1HasAntiox, p2.getHasBenzoyl())) {
            details.add(String.format("[%s]의 벤조일퍼옥사이드 성분과 [%s]의 항산화 성분(레티놀/비타민C)은 서로의 효과를 상쇄하거나 자극을 줄 수 있습니다.",
                Boolean.TRUE.equals(p1.getHasBenzoyl()) ? name1 : name2,
                p1HasAntiox ? name1 : name2));
        }

        // C007: 산성 각질제거제 vs 벤조일
        if (isConflict(p1.getHasAcid(), p2.getHasBenzoyl(), p1.getHasBenzoyl(), p2.getHasAcid())) {
            details.add(String.format("[%s]의 산성 각질제거제 성분과 [%s]의 벤조일퍼옥사이드를 함께 사용하면 피부가 매우 건조해지거나 예민해질 수 있습니다.",
                Boolean.TRUE.equals(p1.getHasAcid()) ? name1 : name2,
                Boolean.TRUE.equals(p1.getHasBenzoyl()) ? name1 : name2));
        }

        // C009: 단백질/EGF vs 강산성
        if (isConflict(p1.getHasProtein(), p2HasStrongAcid, p1HasStrongAcid, p2.getHasProtein())) {
            details.add(String.format("[%s]의 단백질/EGF 성분과 [%s]의 강산성 환경에서 파괴될 수 있으므로 함께 사용하는 것을 피해주세요.",
                Boolean.TRUE.equals(p1.getHasProtein()) ? name1 : name2,
                p1HasStrongAcid ? name1 : name2));
        }

        // C010: 알부틴 vs 강산성
        if (isConflict(p1.getHasArbutin(), p2HasStrongAcid, p1HasStrongAcid, p2.getHasArbutin())) {
            details.add(String.format("[%s]의 알부틴 성분과 [%s]의 강산성 성분을 함께 사용하면 성분이 변형될 위험이 있으니 주의가 필요합니다.",
                Boolean.TRUE.equals(p1.getHasArbutin()) ? name1 : name2,
                p1HasStrongAcid ? name1 : name2));
        }

        return details;
    }

    /**
     * null 안전한 양방향 교차 충돌 확인 헬퍼
     */
    private boolean isConflict(Boolean p1HasA, Boolean p2HasB, Boolean p1HasB, Boolean p2HasA) {
        boolean a1 = Boolean.TRUE.equals(p1HasA);
        boolean b2 = Boolean.TRUE.equals(p2HasB);
        boolean b1 = Boolean.TRUE.equals(p1HasB);
        boolean a2 = Boolean.TRUE.equals(p2HasA);
        return (a1 && b2) || (b1 && a2);
    }
}


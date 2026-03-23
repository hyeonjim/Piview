package com.piview.backend.domain.product.recommend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoutineContextDto {
    // 1. 기본 루틴 상태 정보
    private boolean isEmpty;          // 루틴이 비어있는지 여부
    private double currentDeficitM;   // 현재까지 누적된 수분(M) 오차 (Deficit)
    private double currentDeficitO;   // 현재까지 누적된 유분(O) 오차 (Deficit)
    private List<Long> currentRoutineIds;

    // 2. 성분 충돌(Clash) 검사용 8대 플래그 (현재 루틴 전체 기준)
    private boolean hasRetinol;       // 루틴에 레티놀/바쿠치올 계열이 있는지?
    private boolean hasAcid;          // 루틴에 산성 각질제거제(AHA/BHA/PHA 등)가 있는지?
    private boolean hasPureVitC;      // 루틴에 순수 비타민C(아스코빅애씨드)가 있는지?
    private boolean hasCopperPep;     // 루틴에 구리 펩타이드가 있는지?
    private boolean hasNiacinamide;   // 루틴에 나이아신아마이드가 있는지?
    private boolean hasBenzoyl;       // 루틴에 벤조일퍼옥사이드(여드름약)가 있는지?
    private boolean hasProtein;       // 루틴에 단백질/EGF/콜라겐 성분이 있는지?
    private boolean hasArbutin;       // 루틴에 알부틴이 있는지?

}

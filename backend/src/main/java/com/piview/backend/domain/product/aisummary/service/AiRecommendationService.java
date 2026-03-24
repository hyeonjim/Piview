package com.piview.backend.domain.product.aisummary.service;

import com.piview.backend.domain.product.entity.Product;
import com.piview.backend.domain.skin.survey.entity.MySkin;
import com.piview.backend.domain.skin.survey.repository.MySkinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AiRecommendationService {

  private final MySkinRepository mySkinRepository;

  public String generateLine2Message(Long userId, Product product) {
    List<MySkin> mySkins = mySkinRepository.findAllByUserId(userId);
    if (mySkins.isEmpty()) {
      return "회원님의 피부에 딱 맞는 추천 제품이에요.";
    }

    // 사용자의 첫 번째(또는 대표) 피부 고민
    String userMainProblem = mySkins.get(0).getSkinProblem();

    // 제품이 해당 고민을 해결해주는지 확인
    boolean isMatched = checkProductSolvesProblem(userMainProblem, product);

    // 안티에이징 계열은 텍스트를 부드럽게 출력하기 위해 변환
    String displayProblem = (userMainProblem.equals("주름/탄력") || userMainProblem.equals("노화방지-40대이상"))
        ? "안티에이징" : userMainProblem;

    if (isMatched) {
      return String.format("회원님의 가장 큰 고민인 [%s] 케어에 탁월한 효과를 보이는 제품이에요.", displayProblem);
    } else {
      String productMainEffect = getProductMainEffect(product);

      return String.format("[%s] 집중 케어보다는, [%s] 관리에 아주 탁월한 제품이에요. 새로운 케어가 필요할 때 추천해 드려요!",
          displayProblem, productMainEffect);
    }
  }

  // 📌 피부 고민(String)과 제품 성분(Boolean) 정밀 매핑
  private boolean checkProductSolvesProblem(String problem, Product product) {
    return switch (problem) {
      case "여드름" ->
          isTrue(product.getHasBenzoyl()) || isTrue(product.getHasAcid()); // 벤조일, BHA/AHA
      case "미백", "기미/주근깨/잡티" ->
          isTrue(product.getHasNiacinamide()) || isTrue(product.getHasPureVitC()) || isTrue(product.getHasArbutin());
      case "주름/탄력", "노화방지-40대이상" -> // 5번, 6번 안티에이징 통합
          isTrue(product.getHasRetinol()) || isTrue(product.getHasCopperPep());
      case "피지", "블랙헤드", "각질" ->
          isTrue(product.getHasAcid()); // 모공/각질류는 산성 성분(AHA/BHA) 매핑
      case "속건조", "진정" ->
          isTrue(product.getHasProtein()); // 수분/장벽/진정은 단백질 보습 케어로 매핑
      default -> false; // 아토피(1) 및 기타
    };
  }

  // 📌 불일치 시 어필할 제품의 핵심 효과 추출
  private String getProductMainEffect(Product product) {
    if (isTrue(product.getHasRetinol()) || isTrue(product.getHasCopperPep())) return "안티에이징(주름/탄력)";
    if (isTrue(product.getHasNiacinamide()) || isTrue(product.getHasPureVitC()) || isTrue(product.getHasArbutin())) return "미백 및 잡티 케어";
    if (isTrue(product.getHasBenzoyl())) return "여드름 및 트러블 진정";
    if (isTrue(product.getHasAcid())) return "각질 및 피지 정돈";
    if (isTrue(product.getHasProtein())) return "속건조 및 피부 장벽 강화";

    return "전반적인 피부 컨디션";
  }

  // Null-safe Boolean 체크 헬퍼 메서드
  private boolean isTrue(Boolean value) {
    return Boolean.TRUE.equals(value);
  }
}

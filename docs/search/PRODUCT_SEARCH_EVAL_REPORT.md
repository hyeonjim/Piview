# 상품 검색 평가 리포트

- 생성 시각: `2026-03-28T10:31:47.790081+00:00`
- 질의 수: `500`
- routing accuracy: `0.92`
- 버킷 정확도: `0.92`
- relevance pass rate: `0.88`
- Top-1 약한 정확도: `0.858`
- Top-10 약한 정확도: `0.88`
- overall pass: `0.806`
- zero-result rate: `0.032`
- negative precision@10: `0.902`
- multi-brand coverage@6: `0.9653`
- mean latency(ms): `204.65`
- p50 latency(ms): `194.66`
- p95 latency(ms): `346.19`
- max latency(ms): `1516.77`

## 버킷별 요약

| bucket | caseCount | routingAcc | bucketAcc | relevancePass | top1Acc | top10Acc | overallPass | zeroResult | meanMs | p95Ms | negPrecision | brandCoverage@6 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ambiguous_keyword | 49 | 0.8776 | 0.8776 | 0.7755 | 0.7755 | 0.7755 | 0.6939 | 0.102 | 293.03 | 483.71 | None | None |
| brand_category | 48 | 1.0 | 1.0 | 0.9167 | 0.9167 | 0.9167 | 0.9167 | 0.0625 | 171.22 | 232.82 | None | None |
| brand_only | 24 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 | 172.46 | 227.15 | None | None |
| category_only | 24 | 0.9583 | 0.9583 | 0.875 | 0.875 | 0.875 | 0.8333 | 0.125 | 135.36 | 225.54 | None | None |
| ingredient_category | 48 | 1.0 | 1.0 | 0.7917 | 0.7708 | 0.7917 | 0.7917 | 0.0208 | 229.35 | 292.03 | None | None |
| ingredient_only | 29 | 1.0 | 1.0 | 0.9655 | 0.9655 | 0.9655 | 0.9655 | 0.0 | 297.43 | 427.59 | None | None |
| long_query | 129 | 0.8682 | 0.8682 | 0.7907 | 0.7442 | 0.7907 | 0.6667 | 0.0233 | 184.75 | 319.43 | None | None |
| multi_brand_category | 68 | 1.0 | 1.0 | 0.9559 | 0.9559 | 0.9559 | 0.9559 | 0.0147 | 232.14 | 327.07 | None | 0.9627 |
| negative_ingredient | 44 | 1.0 | 1.0 | 1.0 | 0.9545 | 1.0 | 1.0 | 0.0 | 113.75 | 217.58 | 0.9205 | None |
| noisy_mixed | 37 | 0.5676 | 0.5676 | 0.973 | 0.9189 | 0.973 | 0.5405 | 0.0 | 218.95 | 382.72 | 0.7857 | 1.0 |

## 실패 사례 일부

- [category_only] `클렌저` (expected=`category_only`, actual=`category_only`, top1=`-`)
- [category_only] `수딩젤` (expected=`category_only`, actual=`category_only`, top1=`-`)
- [category_only] `수분크림` (expected=`category_only`, actual=`category_only`, top1=`-`)
- [category_only] `진정크림` (expected=`category_only`, actual=`ambiguous_keyword`, top1=`카모마일 버쳐스 꽃 진정크림`)
- [brand_category] `라운드랩 클렌저` (expected=`brand_category`, actual=`brand_category`, top1=`-`)
- [brand_category] `네이처리퍼블릭 수딩젤` (expected=`brand_category`, actual=`brand_category`, top1=`-`)
- [brand_category] `아비브 세럼` (expected=`brand_category`, actual=`brand_category`, top1=`브라이트닝 세럼`)
- [brand_category] `메이크프렘 클렌저` (expected=`brand_category`, actual=`brand_category`, top1=`-`)
- [multi_brand_category] `메디필 마녀공장 세럼` (expected=`multi_brand_category`, actual=`multi_brand_category`, top1=`브라이트닝 세럼`)
- [multi_brand_category] `성분에디터 아비브 세럼` (expected=`multi_brand_category`, actual=`multi_brand_category`, top1=`브라이트닝 세럼`)
- [multi_brand_category] `아비브 메이크프렘 클렌저` (expected=`multi_brand_category`, actual=`multi_brand_category`, top1=`-`)
- [ingredient_only] `히알루로닉애씨드` (expected=`ingredient_only`, actual=`ingredient_only`, top1=`알부틴 아사이 화이트닝 세럼`)
- [ingredient_category] `히알루론산 세럼` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`포맨 올인원 수분 에센스`)
- [ingredient_category] `히알루론산 크림` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`아쿠아네이쳐 히알루로네이트 크림 셔벗`)
- [ingredient_category] `비타민c 세럼` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`퓨어 브라이트닝 에센스`)
- [ingredient_category] `레티놀 세럼` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`브라이트닝 세럼`)
- [ingredient_category] `알로에 수딩젤` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`-`)
- [ingredient_category] `그린토마토 토너` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`클리어 스킨 버블 토너`)
- [ingredient_category] `약콩 토너` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`클리어 스킨 버블 토너`)
- [ingredient_category] `글루타치온 세럼` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`브라이트닝 세럼`)
- [ingredient_category] `히알루로닉애씨드 세럼` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`브라이트닝 세럼`)
- [ingredient_category] `비타민b5 세럼` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`브라이트닝 세럼`)
- [ambiguous_keyword] `클리어` (expected=`ambiguous_keyword`, actual=`category_only`, top1=`-`)
- [ambiguous_keyword] `시카리오` (expected=`ambiguous_keyword`, actual=`ambiguous_keyword`, top1=`-`)
- [ambiguous_keyword] `시카풀` (expected=`ambiguous_keyword`, actual=`ambiguous_keyword`, top1=`-`)

## 주의

- 이 리포트의 정확도는 정답 상품 ID 라벨이 아니라 브랜드/카테고리/성분/부정 조건 기반의 약한 정답입니다.
- 최종 relevance 평가는 별도 라벨셋과 수동 검수가 필요합니다.

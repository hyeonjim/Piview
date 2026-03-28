# 상품 검색 평가 리포트

- 생성 시각: `2026-03-28T09:48:10.232398+00:00`
- 질의 수: `500`
- routing accuracy: `0.894`
- 버킷 정확도: `0.894`
- relevance pass rate: `0.862`
- Top-1 약한 정확도: `0.826`
- Top-10 약한 정확도: `0.862`
- overall pass: `0.772`
- zero-result rate: `0.032`
- negative precision@10: `0.849`
- multi-brand coverage@6: `0.9653`
- mean latency(ms): `203.01`
- p50 latency(ms): `188.42`
- p95 latency(ms): `352.46`
- max latency(ms): `1531.19`

## 버킷별 요약

| bucket | caseCount | routingAcc | bucketAcc | relevancePass | top1Acc | top10Acc | overallPass | zeroResult | meanMs | p95Ms | negPrecision | brandCoverage@6 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ambiguous_keyword | 46 | 0.8913 | 0.8913 | 0.6957 | 0.6304 | 0.6957 | 0.6304 | 0.1087 | 243.59 | 569.06 | None | None |
| brand_category | 48 | 1.0 | 1.0 | 0.9167 | 0.9167 | 0.9167 | 0.9167 | 0.0625 | 160.06 | 212.95 | None | None |
| brand_only | 24 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 | 183.48 | 215.88 | None | None |
| category_only | 24 | 0.9583 | 0.9583 | 0.875 | 0.875 | 0.875 | 0.8333 | 0.125 | 136.01 | 194.89 | None | None |
| ingredient_category | 48 | 0.9583 | 0.9583 | 0.7917 | 0.7292 | 0.7917 | 0.7917 | 0.0208 | 223.19 | 307.76 | None | None |
| ingredient_only | 32 | 0.9375 | 0.9375 | 0.9688 | 0.9062 | 0.9688 | 0.9062 | 0.0 | 295.93 | 396.56 | None | None |
| long_query | 129 | 0.8682 | 0.8682 | 0.7674 | 0.7209 | 0.7674 | 0.6434 | 0.0233 | 190.6 | 321.71 | None | None |
| multi_brand_category | 68 | 1.0 | 1.0 | 0.9559 | 0.9559 | 0.9559 | 0.9559 | 0.0147 | 224.39 | 318.57 | None | 0.9627 |
| negative_ingredient | 44 | 0.7955 | 0.7955 | 0.9318 | 0.8864 | 0.9318 | 0.7955 | 0.0 | 143.02 | 254.47 | 0.8545 | None |
| noisy_mixed | 37 | 0.5405 | 0.5405 | 0.973 | 0.9189 | 0.973 | 0.5135 | 0.0 | 233.19 | 371.61 | 0.8143 | 1.0 |

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
- [ingredient_only] `알로에` (expected=`ingredient_only`, actual=`long_query`, top1=`티트리 카밍 세럼`)
- [ingredient_only] `글루타치온` (expected=`ingredient_only`, actual=`long_query`, top1=`바이오 씨허브 하이드로 로션`)
- [ingredient_only] `히알루로닉애씨드` (expected=`ingredient_only`, actual=`ingredient_only`, top1=`알부틴 아사이 화이트닝 세럼`)
- [ingredient_category] `히알루론산 세럼` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`포맨 올인원 수분 에센스`)
- [ingredient_category] `히알루론산 크림` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`아쿠아네이쳐 히알루로네이트 크림 셔벗`)
- [ingredient_category] `비타민c 세럼` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`퓨어 브라이트닝 에센스`)
- [ingredient_category] `레티놀 세럼` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`브라이트닝 세럼`)
- [ingredient_category] `알로에 수딩젤` (expected=`ingredient_category`, actual=`long_query`, top1=`-`)
- [ingredient_category] `그린토마토 토너` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`클리어 스킨 버블 토너`)
- [ingredient_category] `약콩 토너` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`클리어 스킨 버블 토너`)
- [ingredient_category] `글루타치온 세럼` (expected=`ingredient_category`, actual=`long_query`, top1=`화이트 더블 세럼`)
- [ingredient_category] `히알루로닉애씨드 세럼` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`브라이트닝 세럼`)
- [ingredient_category] `비타민b5 세럼` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`브라이트닝 세럼`)
- [negative_ingredient] `향료 무첨가 토너` (expected=`negative_ingredient`, actual=`long_query`, top1=`카모마일 아로마틱 워터`)

## 주의

- 이 리포트의 정확도는 정답 상품 ID 라벨이 아니라 브랜드/카테고리/성분/부정 조건 기반의 약한 정답입니다.
- 최종 relevance 평가는 별도 라벨셋과 수동 검수가 필요합니다.

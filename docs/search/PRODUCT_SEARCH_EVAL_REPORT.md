# 상품 검색 평가 리포트

- 생성 시각: `2026-03-28T10:42:53.505850+00:00`
- 질의 수: `524`
- routing accuracy: `0.9237`
- 버킷 정확도: `0.9237`
- relevance pass rate: `0.876`
- Top-1 약한 정확도: `0.855`
- Top-10 약한 정확도: `0.876`
- overall pass: `0.8053`
- zero-result rate: `0.0324`
- negative precision@10: `0.902`
- multi-brand coverage@6: `0.9653`
- mean latency(ms): `202.95`
- p50 latency(ms): `194.63`
- p95 latency(ms): `334.29`
- max latency(ms): `1570.75`

## 버킷별 요약

| bucket | caseCount | routingAcc | bucketAcc | relevancePass | top1Acc | top10Acc | overallPass | zeroResult | meanMs | p95Ms | negPrecision | brandCoverage@6 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ambiguous_keyword | 49 | 0.8776 | 0.8776 | 0.7755 | 0.7755 | 0.7755 | 0.6939 | 0.102 | 280.15 | 457.41 | None | None |
| brand_category | 48 | 1.0 | 1.0 | 0.9167 | 0.9167 | 0.9167 | 0.9167 | 0.0625 | 169.11 | 210.44 | None | None |
| brand_only | 24 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 | 181.73 | 228.91 | None | None |
| category_only | 24 | 0.9583 | 0.9583 | 0.875 | 0.875 | 0.875 | 0.8333 | 0.125 | 128.72 | 183.4 | None | None |
| ingredient_category | 60 | 1.0 | 1.0 | 0.7667 | 0.75 | 0.7667 | 0.7667 | 0.0167 | 212.6 | 297.38 | None | None |
| ingredient_only | 41 | 1.0 | 1.0 | 0.9512 | 0.9512 | 0.9512 | 0.9512 | 0.0244 | 275.33 | 403.33 | None | None |
| long_query | 129 | 0.8682 | 0.8682 | 0.7907 | 0.7442 | 0.7907 | 0.6667 | 0.0233 | 188.03 | 314.52 | None | None |
| multi_brand_category | 68 | 1.0 | 1.0 | 0.9559 | 0.9559 | 0.9559 | 0.9559 | 0.0147 | 230.64 | 330.08 | None | 0.9627 |
| negative_ingredient | 44 | 1.0 | 1.0 | 1.0 | 0.9545 | 1.0 | 1.0 | 0.0 | 108.78 | 204.1 | 0.9205 | None |
| noisy_mixed | 37 | 0.5676 | 0.5676 | 0.973 | 0.9189 | 0.973 | 0.5405 | 0.0 | 223.81 | 374.78 | 0.7857 | 1.0 |

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
- [ingredient_only] `폴리글루탐산` (expected=`ingredient_only`, actual=`ingredient_only`, top1=`-`)
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
- [ingredient_category] `트라넥삼산 세럼` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`브라이트닝 세럼`)
- [ingredient_category] `바쿠치올 세럼` (expected=`ingredient_category`, actual=`ingredient_category`, top1=`브라이트닝 세럼`)

## 주의

- 이 리포트의 정확도는 정답 상품 ID 라벨이 아니라 브랜드/카테고리/성분/부정 조건 기반의 약한 정답입니다.
- 최종 relevance 평가는 별도 라벨셋과 수동 검수가 필요합니다.

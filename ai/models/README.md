## Models

- `binary_best.pt`
  - 얼굴 전체 이미지로 `dry_side / oily_side`를 예측하는 global face 모델

- `forehead_skin_type_best.pt`
  - 이마 ROI로 `dry_side / oily_side`를 예측하는 regional skin_type 모델

- `left_cheek_skin_type_best.pt`
  - 왼볼 ROI로 `dry_side / oily_side`를 예측하는 regional skin_type 모델

- `right_cheek_skin_type_best.pt`
  - 오른볼 ROI로 `dry_side / oily_side`를 예측하는 regional skin_type 모델

- `cheek_mean_moisture_best.pt`
  - 양볼 평균 수분 상태를 추정하는 moisture 모델

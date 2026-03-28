# Frontend 구조

## 개요

프론트엔드는 Next.js App Router 기반으로 구성되어 있으며, 온보딩 플로우와 메인 서비스 화면이 라우트 그룹으로 분리되어 있습니다.

> [!NOTE]
> 라우트 그룹인 `(onboarding)`, `(main)`은 URL 세그먼트에 직접 노출되지 않고, 레이아웃과 화면 흐름 분리를 위한 내부 구조입니다.

## 라우트 구조

### 공통

- `/`
- `/oauth2/redirect`
- `/product/[id]`

### 온보딩 그룹

위치: `frontend/src/app/(onboarding)/`

- `/splash`
- `/welcome`
- `/skin-test`
- `/skin-test/select`
- `/skin-test/photo`
- `/skin-test/survey/[id]`
- `/skin-test/result`

### 메인 그룹

위치: `frontend/src/app/(main)/`

- `/home`
- `/search`
- `/recommend`
- `/likes`
- `/mypage`
- `/mypage/settings`

## 프론트엔드 계층

### app

- 페이지와 레이아웃 정의
- 라우트 그룹 기반 화면 구성

### components

- `common`: 공통 위젯과 UI 컴포넌트
- `features`: 화면 기능 단위 조합 컴포넌트
- `layout`: 하단 내비게이션 등 공통 레이아웃

### services

위치: `frontend/src/services/`

- `auth.ts`
- `skin.ts`
- `product.ts`
- `routine.ts`
- `myCos.ts`
- `ocr.ts`
- `chatbot.ts`
- `disliked.ts`

역할:
- 백엔드 API 호출 캡슐화
- 기능별 HTTP 요청 분리

### hooks

- React Query 기반 데이터 조회/변경 훅
- 기능별 쿼리 키와 요청 로직 연결

### lib

- `queryClient.ts`, `providers.tsx`: React Query 및 전역 provider 설정
- `queryKeys.ts`: 기능별 서버 상태 키 정의
- `client.ts`: `NEXT_PUBLIC_API_URL` 기반 Axios 인스턴스와 인증 토큰 인터셉터 관리

### stores

위치: `frontend/src/stores/`

- `useUserStore.ts`
- `useSurveyStore.ts`
- `useSearchStore.ts`
- `useRoutineStore.ts`
- `useRecommendStore.ts`
- `useLikeStore.ts`
- `useChatbotStore.ts`

역할:
- 페이지 간 공유 상태 유지
- 온보딩, 검색, 추천, 루틴 관련 UI 상태 관리

### types

- 사용자, 상품, 루틴, 챗봇 등 도메인별 요청/응답 타입 정의
- 프론트 UI와 백엔드 API 사이의 데이터 계약을 명시

### utils / constants

- 포맷팅, enum 변환, 이벤트 추적 등 공통 유틸리티
- 설문 문항, 피부 타입, 루틴 단계, 페이지네이션 등의 상수 정의

## UI 특징

- App Router 기반 단일 앱 구조
- PWA 설정 포함
- 로컬 폰트 기반 타이포그래피 구성
- React Query와 Zustand를 함께 사용한 서버 상태/클라이언트 상태 분리

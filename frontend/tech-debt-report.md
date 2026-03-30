# 피뷰(PiView) 프론트엔드 Tech Debt 분석 보고서

**분석 대상:** `frontend/src` 전체
**분석 일자:** 2026-03-30
**기술 스택:** Next.js 16.1.6, React 19, TypeScript 5, Tailwind CSS 4, Zustand 5, TanStack Query 5

---

## 우선순위 점수 계산 공식

```
Priority = (Impact + Risk) × (6 - Effort)
```

- **Impact** 1–5: 개발 속도에 얼마나 영향을 주는가
- **Risk** 1–5: 방치하면 어떤 문제가 생기는가
- **Effort** 1–5: 수정 난이도 (낮을수록 쉬움 = 점수 높음)

---

## 📊 우선순위 요약표

| 순위 | 항목 | 유형 | 점수 | 난이도 |
|------|------|------|------|--------|
| 1 | 에러 바운더리(ErrorBoundary) 없음 | Architecture | **28** | 중간 |
| 2 | `clearAllStores()` 단단하지 않은 구조 | Architecture | **25** | 쉬움 |
| 3 | `toSkinTypeParam` / `toSkinTypeEnum` 중복 | Code | **25** | 쉬움 |
| 4 | 하드코딩 hex 색상값 | Code | **20** | 쉬움 |
| 5 | `window.location.href` 직접 사용 | Architecture | **20** | 쉬움 |
| 6 | `.env.example` 미작성 | Documentation | **20** | 쉬움 |
| 7 | `useSearchStore` ≈ `useRecommendStore` 중복 | Code | **15** | 중간 |
| 8 | Search/Recommend 페이지 로직 중복 | Code | **15** | 중간 |
| 9 | 중복 PWA 패키지 (`next-pwa` + `@ducanh2912/next-pwa`) | Dependency | **15** | 쉬움 |
| 10 | 프로필 이미지 `<img>` 사용 (next/image 미사용) | Code | **15** | 쉬움 |
| 11 | `ProductCard` God Component (~900줄) | Code | **12** | 어려움 |
| 12 | 테스트 코드 전무 | Test | **9** | 매우 어려움 |

---

## 🔴 HIGH (즉시 수정 권장)

### 1. 에러 바운더리(Error Boundary) 없음
**점수: 28** | Architecture Debt

**문제:**
페이지 컴포넌트에 에러 발생 시 전체 화면이 흰 화면으로 뻗어버린다. 현재 isError 체크는 React Query 에러만 잡고, 렌더링 중 발생하는 런타임 에러는 전혀 잡지 못한다.

```tsx
// 현재: isError 수동 체크만 있음
{isError ? (
  <div className="flex justify-center py-20 text-[13px] text-[#a69d92]">
    오류가 발생했어요. 다시 시도해 주세요.
  </div>
) : (...)}
```

**해결 방법:**
```tsx
// app/(main)/error.tsx 파일 하나만 만들면 됨 (Next.js App Router 방식)
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center py-20 gap-4">
      <p className="text-[14px] text-[#a69d92]">오류가 발생했어요.</p>
      <button onClick={reset} className="text-sm text-[#635446] underline">
        다시 시도
      </button>
    </div>
  );
}
```

---

### 2. `clearAllStores()` 취약한 구조
**점수: 25** | Architecture Debt

**문제:**
`services/client.ts` 내 `clearAllStores()`가 모든 Zustand store를 직접 import해서 열거한다. store가 추가되면 이 함수를 반드시 업데이트해야 하는데, 까먹으면 로그아웃 시 상태가 남는 버그가 생긴다.

```ts
// 현재: store 추가할 때마다 여기도 수정해야 함 (누락 가능)
function clearAllStores() {
  useUserStore.getState().clearUser();
  useSearchStore.getState().setSearchQuery("");
  useSearchStore.getState().resetFilter();
  useRecommendStore.getState().resetPage();
  useLikeStore.getState().initFromServer([]);
  useLikeStore.getState().setPage(1);
  // ⚠️ useRoutineStore.clearRecommendedProducts() 빠져 있음!
}
```

**해결 방법:**
각 store에 `reset()` 액션을 추가하고, 중앙 reset 배열로 관리한다.

```ts
// stores/index.ts에 reset 레지스트리 관리
export const storeResets: Array<() => void> = [];

// 각 store 생성 시 등록
storeResets.push(() => useUserStore.getState().clearUser());
storeResets.push(() => useSearchStore.getState().resetFilter());
// ...

// client.ts에서 단 한 줄로 처리
function clearAllStores() {
  storeResets.forEach((reset) => reset());
}
```

---

### 3. `toSkinTypeParam` / `toSkinTypeEnum` 완전 중복
**점수: 25** | Code Debt

**문제:**
`utils/enumConvert.ts`에 두 함수가 동일한 map을 사용하며 로직이 100% 동일하다. 피부타입이 추가되면 두 곳 모두 수정해야 하며, 한 곳만 수정하면 버그가 생긴다.

```ts
// 두 함수가 완전히 동일한 map 사용 중
export const toSkinTypeParam = (skinType: SkinType): string => { ... };
export const toSkinTypeEnum = (skinType: SkinType): string => { ... };
// ↑ 두 함수의 내용이 동일함
```

**해결 방법:**
```ts
// 하나만 남기고, 나머지는 alias로 처리
export const toSkinTypeParam = (skinType: SkinType): string => {
  const map: Record<SkinType, string> = {
    건성: "dry", 지성: "oily", 복합성: "combination", 수부지: "subuji",
  };
  return map[skinType] ?? skinType;
};
// POST 설문용 alias — 동일 로직, 이름만 구분
export const toSkinTypeEnum = toSkinTypeParam;
```

---

## 🟡 MEDIUM (다음 스프린트 수정 권장)

### 4. 하드코딩 hex 색상값 난립
**점수: 20** | Code Debt

**문제:**
`#f9f8f6`, `#faf8f5`, `#635446`, `#a69d92`, `#e9c8b3` 등 같은 색상이 CSS 변수 없이 여러 파일에 직접 박혀 있다. 디자인 변경 시 모든 파일을 찾아 바꿔야 한다.

일부는 잘 정의되어 있음 (`var(--color-brand)`, `var(--color-border)`) → 나머지도 이 방식으로 통일해야 한다.

**해결 방법:**
`globals.css`에 색상 변수 추가:
```css
:root {
  --color-bg-main: #f9f8f6;
  --color-bg-header: #faf8f5;
  --color-text-brown: #635446;
  --color-text-muted: #a69d92;
  --color-compare-active: #e9c8b3;
}
```

---

### 5. `window.location.href` 직접 사용
**점수: 20** | Architecture Debt

**문제:**
`services/client.ts` 인터셉터에서 로그아웃 시 `window.location.href = "/welcome"` 사용 중. Next.js App Router에서는 SSR 시 `window` 객체가 없어 런타임 에러가 발생할 수 있고, 전체 페이지 새로고침으로 TanStack Query 캐시가 날아간다.

```ts
// 현재
window.location.href = "/welcome";  // ⚠️ SSR 비호환, 캐시 전체 소멸
```

**해결 방법:**
`router.replace()`로 교체 (단, axios 인터셉터는 React 훅 외부이므로 전역 이벤트 패턴 사용):
```ts
// 커스텀 이벤트로 Router 연결
window.dispatchEvent(new CustomEvent('auth:logout'));

// providers.tsx에서 리스닝
useEffect(() => {
  const handler = () => router.replace('/welcome');
  window.addEventListener('auth:logout', handler);
  return () => window.removeEventListener('auth:logout', handler);
}, [router]);
```

---

### 6. `.env.example` 미작성
**점수: 20** | Documentation Debt

**문제:**
`client.ts`에 `NEXT_PUBLIC_API_URL` 환경변수가 사용되는데 `.env.example`이 없다. 새 팀원이나 배포 환경 설정 시 어떤 변수가 필요한지 코드를 뒤져야 한다.

**해결 방법:**
프로젝트 루트 또는 `frontend/`에 `.env.example` 파일 생성:
```env
# API 서버 주소 (미설정 시 http://localhost:8080 으로 fallback)
NEXT_PUBLIC_API_URL=https://your-api-server.com
```

---

### 7. `useSearchStore` ≈ `useRecommendStore` 중복 구조
**점수: 15** | Code Debt

**문제:**
두 store의 인터페이스와 구현이 거의 동일하다 (검색어, 카테고리 ID, 필터, 페이지네이션). 필터 로직에 변경이 생기면 두 store 모두 수정해야 한다.

```ts
// useSearchStore와 useRecommendStore는 구조가 99% 동일
interface SearchStore { searchQuery, selectedBigCategoryId, filter, page, ... }
interface RecommendStore { searchQuery, selectedBigCategoryId, filter, page, ... }
```

**해결 방법:**
공통 factory 함수로 추출:
```ts
// stores/createFilterStore.ts
export function createFilterStore(name: string) {
  return create<FilterStore>()((set) => ({
    searchQuery: "",
    // ... 공통 상태 및 액션
  }));
}
export const useSearchStore = createFilterStore('search');
export const useRecommendStore = createFilterStore('recommend');
```

---

### 8. Search/Recommend 페이지 내 로직 중복
**점수: 15** | Code Debt

**문제:**
`search/page.tsx`와 `recommend/page.tsx`에 다음 로직들이 완전히 중복:
- tagIds/brandIds 배열 추출 로직 (12줄)
- "비교 힌트 바" UI 블록 (30줄씩)
- `isOwned`/`handleToggleOwned` 로직

**해결 방법:**
공통 hook과 컴포넌트로 추출:
```ts
// hooks/useFilterParams.ts — tagIds/brandIds 변환 로직 공통화
// components/common/CompareHintBar.tsx — 비교 힌트 바 컴포넌트 분리
// hooks/useMyCosActions.ts — isOwned/handleToggleOwned 공통화
```

---

### 9. 중복 PWA 패키지
**점수: 15** | Dependency Debt

**문제:**
`package.json`에 `next-pwa@5` (미관리 상태, 마지막 업데이트 2022년)와 `@ducanh2912/next-pwa@10` (활성 유지 포크)가 동시에 설치되어 있다. 빌드 크기 증가 및 충돌 가능성이 있다.

```json
"@ducanh2912/next-pwa": "^10.2.9",  // 활성 유지 포크
"next-pwa": "^5.6.0",               // ⚠️ 미관리, 중복
```

**해결 방법:**
`next-pwa` 제거:
```bash
pnpm remove next-pwa
```
`@ducanh2912/next-pwa`만 사용.

---

### 10. 프로필 이미지 `<img>` 태그 사용
**점수: 15** | Code Debt

**문제:**
`mypage/page.tsx`에서 프로필 이미지를 `<img>` 태그로 렌더링하며 `eslint-disable` 주석으로 경고를 묵인 중. Next.js Image 최적화(lazy loading, WebP 변환, 크기 최적화)를 놓친다.

```tsx
{/* eslint-disable-next-line @next/next/no-img-element */}
<img src={profileImageUrl} alt="프로필 이미지" ... />
```

**해결 방법:**
```tsx
import Image from "next/image";
<Image
  src={profileImageUrl}
  alt="프로필 이미지"
  width={72}
  height={72}
  className="w-full h-full object-cover"
/>
```

---

## 🟢 LOW (중장기 개선)

### 11. `ProductCard` God Component (~900줄)
**점수: 12** | Code Debt

**문제:**
`ProductCard.tsx`가 4가지 레이아웃 변형(grid, horizontal, modal, routine-modal)과 20개 이상의 props를 처리하는 단일 파일 (~900줄). 특정 variant 수정 시 다른 variant에 영향 줄 위험이 있고, 컴포넌트 가독성이 낮다.

**해결 방법 (점진적):**
```
components/common/
├── ProductCard/
│   ├── ProductCardGrid.tsx      (grid layout)
│   ├── ProductCardHorizontal.tsx
│   ├── ProductCardModal.tsx     (modal + routine-modal)
│   └── index.ts                 (기존 API 유지 wrapper)
```

---

### 12. 테스트 코드 전무
**점수: 9** | Test Debt

**문제:**
`package.json`에 test 스크립트가 없고, 테스트 파일이 전혀 없다. `babel-plugin-react-compiler`는 devDependencies에 있으나 테스트 설정은 없다.

**해결 방법 (단계별):**
1. **Phase 1:** Vitest + Testing Library 설치, 유틸 함수 테스트 먼저
   - `utils/enumConvert.ts` 변환 함수 — 피부타입 매핑 정확성 검증
   - `utils/productMapper.ts` — 서버 → 뷰모델 변환 검증
2. **Phase 2:** 핵심 hook 테스트 (`useLike`, `useCompare`)
3. **Phase 3:** 컴포넌트 스냅샷 테스트

---

## 🗓️ 단계별 개선 로드맵

### Phase 1 — 빠른 승리 (0.5일 이내, 바로 시작)
기능 변경 없이 코드 품질 개선:

- [ ] `toSkinTypeEnum` → `toSkinTypeParam` alias로 변경
- [ ] `next-pwa` 패키지 제거
- [ ] `.env.example` 파일 작성
- [ ] 프로필 이미지 `<img>` → `<Image>` 교체
- [ ] `clearAllStores()` 취약 구조 개선

### Phase 2 — 구조 개선 (피처 작업과 병행)
- [ ] Error Boundary (`app/**/error.tsx`) 추가
- [ ] 중복 hex 색상 → CSS 변수 전환
- [ ] `window.location.href` → 커스텀 이벤트 패턴으로 교체
- [ ] `useFilterParams` 공통 hook 추출
- [ ] `CompareHintBar` 컴포넌트 분리

### Phase 3 — 장기 리팩터링 (여유 있을 때)
- [ ] `useSearchStore` / `useRecommendStore` 공통 factory 추출
- [ ] `ProductCard` 4개 파일로 분리
- [ ] Vitest 설정 + 유틸 함수 테스트 추가

---

## ✅ 잘 된 점 (유지)

| 항목 | 이유 |
|------|------|
| `queryKeys.ts` 중앙 관리 | invalidateQueries 누락 방지 완벽히 해결 |
| axios 인터셉터 refresh 로직 | `_retry` 플래그, 403/401 분기 처리 세심함 |
| services 레이어 분리 | 서비스 함수 ↔ React Query hook 관심사 분리 명확 |
| 타입 도메인별 폴더 구조 | `types/product/`, `types/user/` 등 체계적 |
| Zustand store 주석 | 각 필드/액션에 한국어 주석 일관성 있음 |
| `productMapper.ts` 존재 | 서버 응답 → ViewModel 변환 한 곳에서 처리 |

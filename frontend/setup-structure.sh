#!/bin/bash
# 피뷰 폴더 구조 세팅 스크립트
# 프로젝트 루트에서 실행: bash setup-structure.sh

set -e

echo "📁 폴더 구조 생성 중..."

# (onboarding) 그룹
mkdir -p src/app/\(onboarding\)/splash
mkdir -p src/app/\(onboarding\)/welcome
mkdir -p src/app/\(onboarding\)/skin-test/quiz
mkdir -p src/app/\(onboarding\)/skin-test/select
mkdir -p src/app/\(onboarding\)/skin-test/result

# (main) 그룹
mkdir -p src/app/\(main\)/home
mkdir -p src/app/\(main\)/recommend
mkdir -p src/app/\(main\)/search
mkdir -p src/app/\(main\)/routine
mkdir -p src/app/\(main\)/mypage
mkdir -p src/app/\(main\)/likes

# product (BottomNav 없음)
mkdir -p src/app/product/\[id\]

echo "✅ 폴더 생성 완료"

# ── 기존 파일 이동 (이미 있는 경우에만) ──
echo ""
echo "📦 기존 파일 이동 중..."

move_if_exists() {
  if [ -f "$1" ]; then
    mv "$1" "$2"
    echo "  moved: $1 → $2"
  fi
}

# skin-test → (onboarding)/skin-test
move_if_exists "src/app/skin-test/page.tsx"             "src/app/(onboarding)/skin-test/page.tsx"
move_if_exists "src/app/skin-test/quiz/page.tsx"        "src/app/(onboarding)/skin-test/quiz/page.tsx"
move_if_exists "src/app/skin-test/select/page.tsx"      "src/app/(onboarding)/skin-test/select/page.tsx"

# splash, welcome → (onboarding)
move_if_exists "src/app/splash/page.tsx"                "src/app/(onboarding)/splash/page.tsx"
move_if_exists "src/app/welcome/page.tsx"               "src/app/(onboarding)/welcome/page.tsx"

# 빈 폴더 정리
rm -rf src/app/skin-test 2>/dev/null || true
rm -rf src/app/splash    2>/dev/null || true
rm -rf src/app/welcome   2>/dev/null || true

echo "✅ 파일 이동 완료"

# ── (onboarding) layout 생성 ──
echo ""
echo "📝 layout 파일 생성 중..."

cat > src/app/\(onboarding\)/layout.tsx << 'EOF'
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
EOF
echo "  created: src/app/(onboarding)/layout.tsx"

# ── root page.tsx (splash로 리다이렉트) ──
cat > src/app/page.tsx << 'EOF'
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/splash");
}
EOF
echo "  created: src/app/page.tsx"

echo ""
echo "🎉 완료! 최종 구조:"
echo ""
echo "app/"
echo "├── (onboarding)/"
echo "│   ├── layout.tsx"
echo "│   ├── splash/"
echo "│   ├── welcome/"
echo "│   └── skin-test/"
echo "│       ├── page.tsx"
echo "│       ├── quiz/"
echo "│       ├── select/"
echo "│       └── result/"
echo "├── (main)/"
echo "│   ├── layout.tsx  ← BottomNav 포함 (기존)"
echo "│   ├── home/"
echo "│   ├── recommend/"
echo "│   ├── search/"
echo "│   ├── routine/"
echo "│   ├── mypage/"
echo "│   └── likes/"
echo "├── product/[id]/"
echo "├── layout.tsx      ← root layout (기존)"
echo "├── page.tsx        ← /splash 리다이렉트"
echo "└── globals.css"

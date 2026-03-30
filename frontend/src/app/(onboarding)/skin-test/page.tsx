import { ArrowLeft, Camera, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
// [next/link] Next.js가 제공하는 클라이언트 사이드 네비게이션 컴포넌트
// - 일반 <a> 태그와 달리 페이지 전체를 새로 로드하지 않고 필요한 JS/데이터만 교체 (SPA 방식)
// - 뷰포트에 들어오는 순간 대상 페이지를 미리 fetch(prefetch)하여 클릭 시 즉시 전환
// - "use client" 없이 서버 컴포넌트에서도 사용 가능 (내부적으로 클라이언트 동작 캡슐화)
// - 최종 HTML은 <a> 태그로 렌더링 → SEO·접근성 유지
// - useRouter().push()와 달리 이벤트 핸들러가 필요 없어 코드가 단순해짐
import Link from "next/link";

interface SkinTestOption {
  key: string;
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const SKIN_TEST_OPTIONS: SkinTestOption[] = [
  {
    key: "photo",
    href: "/skin-test/photo",
    icon: Camera,
    title: "AI 사진 분석",
    description: "얼굴 사진으로 AI가 피부 타입을 분석해요",
  },
  {
    key: "know",
    href: "/skin-test/select",
    icon: Target,
    title: "알고 있어요",
    description: "피부 타입을 직접 선택합니다",
  },
];

export default function SkinTestPage() {
  return (
    <div className="flex flex-col min-h-screen px-10 bg-warm-bg">
      {/* 뒤로가기 버튼
          href="/welcome" → 내부 경로는 문자열로 직접 전달
          외부 URL도 가능: href="https://example.com" (이 경우 prefetch 미적용) */}
      <div className="flex items-center pt-4 pb-2">
        <Link href="/welcome" className="p-2 -ml-2">
          <ArrowLeft size={22} className="text-text-primary" />
        </Link>
      </div>

      <div className="mt-8">
        <h1 className="text-text-primary font-bold text-2xl leading-[1.4]">
          내 피부 타입을 설정합니다
        </h1>
      </div>

      {/* 진단 방법 선택 카드 목록
          <Link>는 <a>로 렌더링되므로 block/flex 레이아웃을 className으로 직접 제어
          <button>처럼 onClick 없이 href 하나로 네비게이션 처리 */}
      <div className="mt-8 flex flex-col gap-3">
        {SKIN_TEST_OPTIONS.map(({ key, href, icon: Icon, title, description }) => (
          <Link
            key={key}
            href={href} // 각 옵션의 목적지 경로 — prefetch 대상이 됨
            className="group w-full p-5 transition-all duration-200 relative rounded-2xl border-[1.5px] bg-white border-[#E8E0D0] shadow-[0px_1px_3px_rgba(0,0,0,0.04)] hover:border-brand hover:shadow-[0px_4px_12px_rgba(162,170,123,0.15)]"
          >
            <div className="text-text-faint group-hover:text-brand transition-colors duration-200">
              <Icon size={24} />
            </div>
            <p className="text-text-primary font-bold text-[17px] mt-2.5">{title}</p>
            <p className="text-text-muted text-[15px] mt-1 leading-normal">{description}</p>
          </Link>
        ))}
      </div>

    </div>
  );
}

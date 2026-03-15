/**
 * lib/providers.tsx
 * "use client" 선언이 필요한 프로바이더 모음
 *
 * Next.js App Router의 app/layout.tsx는 서버 컴포넌트이므로
 * QueryClientProvider 같은 클라이언트 컴포넌트를 직접 넣을 수 없습니다.
 * 이 파일의 모음을 layout.tsx에서 <Providers>로 한 번에 주입합니다.
 *
 * ⚠️ API 연동 시 TanStack Query 패키지 설치 후 주석 해제
 * npm install @tanstack/react-query
 */

"use client";

// import { QueryClientProvider } from "@tanstack/react-query";
// import { queryClient } from "./queryClient";
import { Toaster } from "@/components/ui/sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    // ⚠️ API 연동 시 QueryClientProvider로 감싸기
    // <QueryClientProvider client={queryClient}>
    <>
      {children}
      <Toaster position="top-center" richColors />
    </>
    // </QueryClientProvider>
  );
}

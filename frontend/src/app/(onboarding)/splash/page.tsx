import { redirect } from "next/navigation";

// 스플래시 페이지 제거
// /splash 경로 자체는 유지 — client.ts, useLogout.ts 호환성
export default function SplashPage() {
  redirect("/welcome");
}

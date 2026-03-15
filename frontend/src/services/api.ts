import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
  // httpOnly 쿠키 방식 — 로그인 시 백엔드가 Set-Cookie로 토큰 발급
  withCredentials: true,
});

// ⚠️ 로그인 구현 시 인터셉터 추가 불필요
// withCredentials: true 로 쿠키가 자동 전송됨

export default api;

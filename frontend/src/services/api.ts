import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

// 요청 인터셉터 — 백엔드 인증 방식 확인 후 수정
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken"); // JWT 방식일 경우
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

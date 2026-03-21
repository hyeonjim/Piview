import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true, // Next.js 서버 경유 안 함 → 브라우저가 S3 직접 접근
    remotePatterns: [
      {
        protocol: "https",
        hostname: "piview-products-images.s3.ap-northeast-2.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;

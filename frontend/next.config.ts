import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "piview-products-images.s3.ap-northeast-2.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;

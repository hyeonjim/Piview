"use client";

import { Heart } from "lucide-react";
import { EmptyState } from "@/components/common";

export default function LikesPage() {
  const likedProducts: never[] = [];

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Heart size={18} className="fill-red-400 text-red-400" />
          <h1 className="text-lg font-bold text-text-primary">찜 목록</h1>
        </div>
        <p className="text-sm text-text-muted mt-0.5">
          {likedProducts.length}개의 제품을 찜했어요
        </p>
      </div>

      {likedProducts.length === 0 && (
        <div className="flex-1 flex items-center justify-center pb-24">
          <EmptyState
            icon={Heart}
            title="아직 찜한 제품이 없어요"
            description={"제품의 하트 버튼을 눌러\n관심 제품을 저장해보세요"}
          />
        </div>
      )}
    </div>
  );
}

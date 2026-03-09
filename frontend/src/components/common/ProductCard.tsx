// src/components/common/ProductCard.tsx
"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import EWGIndicator from "./EWGIndicator";

interface ProductCardProps {
  id: number;
  name: string;
  brand: string;
  imageUrl?: string;
  ewgSafe?: number;
  ewgCaution?: number;
  ewgDanger?: number;
  liked?: boolean;
  onLike?: (id: number) => void;
  /** vertical(세로 카드, 기본) | horizontal(가로 카드, 루틴 목록용) */
  layout?: "vertical" | "horizontal";
}

export default function ProductCard({
  id,
  name,
  brand,
  imageUrl,
  ewgSafe = 0,
  ewgCaution = 0,
  ewgDanger = 0,
  liked = false,
  onLike,
  layout = "vertical",
}: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(liked);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLiked((p) => !p);
    onLike?.(id);
  };

  if (layout === "horizontal") {
    return (
      <Link href={`/product/${id}`}>
        {/* 피그마: bg-white border border-[#f0f0f0] rounded-[16px] h-[85px] */}
        <div className="flex items-center bg-bg-card border border-border rounded-card shadow-card overflow-hidden h-[88px]">
          {/* 이미지 */}
          <div className="relative w-[88px] h-full shrink-0 bg-bg-surface">
            {imageUrl ? (
              <Image src={imageUrl} alt={name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🧴</span>
              </div>
            )}
          </div>
          {/* 텍스트 */}
          <div className="flex-1 px-3 py-2 min-w-0">
            <p className="text-xs text-text-muted truncate">{brand}</p>
            <p className="text-sm font-medium text-text-primary mt-0.5 line-clamp-2 leading-snug">
              {name}
            </p>
            <EWGIndicator
              safe={ewgSafe}
              caution={ewgCaution}
              danger={ewgDanger}
              className="mt-1.5"
            />
          </div>
          {/* 좋아요 */}
          <button onClick={handleLike} className="p-3 shrink-0">
            <Heart
              size={18}
              className={cn(
                "transition-colors",
                isLiked ? "fill-red-400 text-red-400" : "text-text-muted"
              )}
            />
          </button>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/product/${id}`}>
      {/* 피그마: bg-white rounded-[16px] shadow-[0px_5px_16px_rgba(152,152,152,0.2)] w-[265px] */}
      <div className="relative bg-bg-card rounded-card shadow-card overflow-hidden flex flex-col w-[160px]">
        {/* 이미지 */}
        <div className="relative h-[160px] bg-bg-surface">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-brand-pale flex items-center justify-center">
                <span className="text-3xl">🧴</span>
              </div>
            </div>
          )}
          {/* 좋아요 버튼 */}
          <button
            onClick={handleLike}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm"
          >
            <Heart
              size={15}
              className={cn(
                "transition-colors",
                isLiked ? "fill-red-400 text-red-400" : "text-text-muted"
              )}
            />
          </button>
        </div>
        {/* 텍스트 */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          <p className="text-xs text-text-muted truncate">{brand}</p>
          <p className="text-sm font-medium text-text-primary leading-snug line-clamp-2">
            {name}
          </p>
          <EWGIndicator
            safe={ewgSafe}
            caution={ewgCaution}
            danger={ewgDanger}
            className="mt-1"
          />
        </div>
      </div>
    </Link>
  );
}

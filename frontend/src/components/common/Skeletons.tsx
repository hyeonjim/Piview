// src/components/common/Skeletons.tsx
// shadcn Skeleton 기반 — 제품카드, 루틴카드 로딩 스켈레톤
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** 세로 제품 카드 스켈레톤 */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("w-[160px] rounded-card overflow-hidden", className)}>
      <Skeleton className="h-[160px] w-full rounded-t-card rounded-b-none" />
      <div className="bg-bg-card p-3 flex flex-col gap-2 rounded-b-card">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-1.5 w-full mt-1 rounded-full" />
      </div>
    </div>
  );
}

/** 가로 제품 카드 스켈레톤 */
export function ProductCardHorizontalSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center h-[88px] bg-bg-card rounded-card overflow-hidden", className)}>
      <Skeleton className="w-[88px] h-full rounded-l-card rounded-r-none shrink-0" />
      <div className="flex-1 px-3 py-2 flex flex-col gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-1.5 w-3/4 rounded-full" />
      </div>
    </div>
  );
}

/** 루틴 카드 스켈레톤 */
export function RoutineCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-bg-card rounded-card p-4 flex flex-col gap-3", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-icon shrink-0" />
        <div className="flex-1 flex flex-col gap-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="w-10 h-10 rounded-icon" />
        ))}
      </div>
    </div>
  );
}

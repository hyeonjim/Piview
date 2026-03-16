// src/components/common/index.ts
// 공통 컴포넌트 일괄 export — import { Button, Header, ... } from "@/components/common"

export { default as Button } from "./Button";
export { default as Header } from "./Header";
export { default as SearchBar } from "./SearchBar";
export { default as ProductCard } from "./ProductCard";
export { default as EWGIndicator } from "./EWGIndicator";
export { CategoryBadge, SkinTypeBadge, EWGBadge } from "./Badge";
export { default as PageLayout } from "./PageLayout";
export { default as SectionHeader } from "./SectionHeader";
export { default as IconButton } from "./IconButton";
export { default as EmptyState } from "./EmptyState";
export { default as FilterButton } from "./FilterButton";
export {
  ProductCardSkeleton,
  ProductCardHorizontalSkeleton,
  RoutineCardSkeleton,
} from "./Skeletons";

export { Toast } from "./Toast";
export { Pagination } from "./Pagination";
export { CategoryFilter } from "./CategoryFilter";

/**
 * hooks/useScroll.ts
 *
 * 특정 스크롤 컨테이너의 scrollTop을 감지합니다.
 * search, recommend 페이지의 sticky 필터 전환에 공용 사용.
 *
 * 사용법:
 *   const { scrollRef, isScrolled } = useScroll({ threshold: 100 });
 *   <div ref={scrollRef} className="overflow-y-auto"> ... </div>
 */

import { useRef, useState, useEffect } from "react";

interface UseScrollOptions {
  /** scrollTop이 이 값을 넘으면 isScrolled = true (기본값 100) */
  threshold?: number;
}

export function useScroll({ threshold = 100 }: UseScrollOptions = {}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handler = () => {
      setIsScrolled(el.scrollTop > threshold);
    };

    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [threshold]);

  return { scrollRef, isScrolled };
}

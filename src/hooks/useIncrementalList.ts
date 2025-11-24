import { useCallback, useEffect, useRef, useState } from "react";

export function useIncrementalList<T>(items: T[], step = 20) {
  const [visibleCount, setVisibleCount] = useState(step);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(step);
  }, [items, step]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => (prev < items.length ? Math.min(items.length, prev + step) : prev));
  }, [items.length, step]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    }, { threshold: 0.1 });

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, sentinelRef]);

  const visibleItems = items.slice(0, visibleCount);

  return {
    items: visibleItems,
    hasMore: visibleCount < items.length,
    sentinelRef,
  } as const;
}

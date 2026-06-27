import { ReactNode, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type ShowMoreListProps<T> = {
  items: T[];
  initial?: number;
  step?: number;
  className?: string;
  buttonClassName?: string;
  buttonLabel?: string;
  empty?: ReactNode;
  renderItem: (item: T, index: number) => ReactNode;
};

const ShowMoreList = <T,>({
  items,
  initial = 5,
  step = 5,
  className = "space-y-2",
  buttonClassName = "h-11 w-full rounded-2xl border-white/10 bg-secondary font-semibold",
  buttonLabel = "Lihat lebih banyak",
  empty,
  renderItem,
}: ShowMoreListProps<T>) => {
  const [visible, setVisible] = useState(initial);

  useEffect(() => {
    setVisible(initial);
  }, [initial, items.length]);

  const visibleItems = items.slice(0, visible);
  const hasMore = visible < items.length;
  const remaining = Math.max(0, items.length - visible);

  if (!items.length) return <>{empty}</>;

  return (
    <div className={className}>
      {visibleItems.map(renderItem)}
      {hasMore && (
        <Button type="button" variant="outline" onClick={() => setVisible((current) => current + step)} className={buttonClassName}>
          {buttonLabel}
          <span className="ml-2 rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-black text-muted-foreground">
            +{Math.min(step, remaining)}
          </span>
        </Button>
      )}
    </div>
  );
};

export { ShowMoreList };

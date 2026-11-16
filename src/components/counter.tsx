"use client";

import { Button } from "@/components/ui/button";
import { useCounterStore } from "@/store/use-counter-store";

export function Counter() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const decrement = useCounterStore((state) => state.decrement);

  return (
    <div className="flex items-center gap-4">
      <Button onClick={decrement}>-</Button>

      <span data-testid="count">{count}</span>

      <Button onClick={increment}>+</Button>
    </div>
  );
}
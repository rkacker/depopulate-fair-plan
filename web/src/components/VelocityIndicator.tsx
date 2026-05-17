import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { Direction } from "@/types";

export function VelocityIndicator({
  direction,
  changePct,
}: {
  direction: Direction;
  changePct: number | null;
}) {
  if (direction === "new" || changePct === null) {
    return <span className="text-gray-400">—</span>;
  }
  const sign = changePct > 0 ? "+" : "";
  const formatted = `${sign}${changePct.toFixed(1)}%`;
  if (direction === "up") {
    return (
      <span className="inline-flex items-center justify-end gap-1 text-patriot-red">
        <TrendingUp className="h-4 w-4" aria-label="increase" />
        <span className="font-semibold">{formatted}</span>
      </span>
    );
  }
  if (direction === "down") {
    return (
      <span className="inline-flex items-center justify-end gap-1 text-emerald-600">
        <TrendingDown className="h-4 w-4" aria-label="decrease" />
        <span className="font-semibold">{formatted}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-end gap-1 text-gray-500">
      <Minus className="h-4 w-4" aria-label="flat" />
      <span className="font-semibold">{formatted}</span>
    </span>
  );
}

export function ChangeIcon({ direction }: { direction: Direction }) {
  if (direction === "up") return <TrendingUp className="h-3.5 w-3.5 text-patriot-red" />;
  if (direction === "down") return <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />;
  if (direction === "flat") return <Minus className="h-3.5 w-3.5 text-gray-500" />;
  return null;
}

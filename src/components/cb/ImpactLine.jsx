import { Info } from "lucide-react";
import { FORMULA, impactLine } from "@/lib/impact";

/** One grey line under a gram figure, with the formula behind an info icon. */
export default function ImpactLine({ grams, scope = "office", eligible = 150, className = "" }) {
  if (!grams) return null;
  return (
    <p className={`flex items-center gap-1.5 text-[11.5px] leading-snug text-sub ${className}`}>
      <span>{impactLine(grams, scope, eligible)}</span>
      <span
        title={`Impact translator · ${FORMULA[scope]}`}
        className="inline-flex h-3.5 w-3.5 shrink-0 cursor-help items-center justify-center rounded-full border border-rule text-sub/80"
        aria-label={`Formula: ${FORMULA[scope]}`}
      >
        <Info size={8.5} strokeWidth={2.4} />
      </span>
    </p>
  );
}
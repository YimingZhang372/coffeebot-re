import { useState } from "react";
import seed from "@/lib/communitySeed.json";
import { FLOORS } from "@/lib/programme";
import { useProgramme } from "@/lib/programmeData";

/** Floor Champion introduction: one line, and a way to ask them something. */
export default function ChampionCard({ onAsk }) {
  const { me, employees } = useProgramme();
  const [floor, setFloor] = useState(me?.floorCode || "L10");

  const champion = employees.find((e) => e.floorCode === floor && e.role === "champion");
  const intro = seed.champions[floor];

  return (
    <div className="bg-paper p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-sub">floor champion</p>
        <span className="text-[11px] tabular text-sub">{floor}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DFDBD6] text-[11px] uppercase tracking-[0.06em] text-ink">
          {(champion?.name || intro?.name || "—").split(" ").slice(0, 2).map((p) => p[0]).join("")}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] text-ink">{champion?.name || intro?.name}</p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-sub">{floor} · validator</p>
        </div>
      </div>
      <p className="mt-2.5 text-[12px] leading-relaxed text-sub">{intro?.line}</p>
      <button
        type="button"
        onClick={() => onAsk?.(floor, champion?.name || intro?.name)}
        className="mt-3 w-full rounded-full border-[1.5px] border-ink px-3 py-1.5 text-[11px] lowercase transition-colors hover:border-caramel hover:text-caramel"
      >
        ask me
      </button>
      <div className="mt-3 flex flex-wrap gap-1 border-t border-rule pt-2.5">
        {FLOORS.map((f) => (
          <button
            key={f.code}
            type="button"
            onClick={() => setFloor(f.code)}
            className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] transition-colors ${
              f.code === floor ? "bg-ink text-white" : "text-sub hover:text-ink"
            }`}
          >
            {f.code}
          </button>
        ))}
      </div>
    </div>
  );
}
import { useMemo } from "react";
import { timeAgo } from "@/lib/programme";
import { useProgramme } from "@/lib/programmeData";

export default function Ticker() {
  const { collections, reuses, maskLabel } = useProgramme();

  const items = useMemo(() => {
    const fromCollections = collections
      .slice()
      .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
      .slice(0, 6)
      .map((c) => `${c.floorCode} colleague collected ${c.grams} g · ${timeAgo(c.occurredAt)}`);
    const fromReuse = reuses
      .filter((r) => r.status === "validated")
      .slice()
      .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
      .slice(0, 6)
      .map((r) => {
        const who = r.showName ? r.employeeName : `${r.floorCode} colleague`;
        return `${who} reported ${r.grams} g reused · ${timeAgo(r.occurredAt)}`;
      });
    return [...fromCollections, ...fromReuse].slice(0, 10);
  }, [collections, reuses]);

  if (!items.length) return null;

  return (
    <div className="overflow-hidden border-b border-rule bg-white/50">
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-5 py-1.5 sm:px-8">
        <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-sub">live</span>
        <div className="relative flex-1 overflow-hidden">
          <div className="cb-marquee-track" style={{ animationDuration: "60s" }}>
            {[...items, ...items].map((text, i) => (
              <span key={i} className="flex shrink-0 items-center gap-4 pr-8 text-[12px] text-sub">
                {text}
                <span className="h-1 w-1 rounded-full bg-caramel" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
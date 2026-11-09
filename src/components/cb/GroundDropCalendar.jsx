import { groundDropCalendar } from "@/lib/groundDrop";
import { nowSgt } from "@/lib/programme";

const DAY = 86400000;

/** Compact four-week grid, Monday to Sunday. Drop days filled, clear-out outlined, today circled. */
export default function GroundDropCalendar({ settings }) {
  const weeks = groundDropCalendar(settings, 4);
  const sgt = nowSgt();
  const today = Date.UTC(sgt.getUTCFullYear(), sgt.getUTCMonth(), sgt.getUTCDate());
  const mondayOffset = (new Date(today).getUTCDay() + 6) % 7;
  const start = today - mondayOffset * DAY;

  const days = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(start + i * DAY);
    const isDrop = weeks.some((w) => w.drop.getTime() === d.getTime());
    const isClear = weeks.some((w) => w.clearOut.getTime() === d.getTime());
    days.push({ d, isDrop, isClear, isToday: d.getTime() === today });
  }

  return (
    <div className="max-h-[260px]">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-sub">
        <span>four weeks</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ink" /> drop
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-caramel" /> clear-out
          </span>
        </span>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-[3px] text-center text-[9px] uppercase tracking-[0.1em] text-sub/60">
        {["m", "t", "w", "t", "f", "s", "s"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-[3px]">
        {days.map(({ d, isDrop, isClear, isToday }, i) => (
          <span
            key={i}
            className={`flex h-[26px] items-center justify-center rounded-[2px] text-[11px] tabular ${
              isDrop
                ? "bg-ink text-white"
                : isClear
                ? "border border-caramel text-caramel"
                : "border border-rule/60 text-sub"
            } ${isToday ? "outline outline-1 outline-offset-1 outline-ink" : ""}`}
          >
            {d.getUTCDate()}
          </span>
        ))}
      </div>
    </div>
  );
}
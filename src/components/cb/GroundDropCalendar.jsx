import { groundDropCalendar } from "@/lib/groundDrop";
import { nowSgt } from "@/lib/programme";

export default function GroundDropCalendar({ settings }) {
  const weeks = groundDropCalendar(settings, 4);
  const sgt = nowSgt();
  const today = Date.UTC(sgt.getUTCFullYear(), sgt.getUTCMonth(), sgt.getUTCDate());

  const days = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(today + i * 86400000);
    const isDrop = weeks.some((w) => w.drop.getTime() === d.getTime());
    const isClear = weeks.some((w) => w.clearOut.getTime() === d.getTime());
    days.push({ d, isDrop, isClear, isToday: i === 0 });
  }

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-sub">
        <span>next four weeks</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ink" /> drop
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-caramel" /> clear-out
          </span>
        </span>
      </div>
      <div className="mt-3 grid grid-cols-14 gap-[3px]">
        {days.map(({ d, isDrop, isClear, isToday }, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className="text-[9px] uppercase text-sub/60">
              {["s", "m", "t", "w", "t", "f", "s"][d.getUTCDay()]}
            </span>
            <span
              className={`flex h-7 w-full items-center justify-center rounded-[2px] text-[11px] tabular ${
                isDrop
                  ? "bg-ink text-white"
                  : isClear
                  ? "border border-caramel text-caramel"
                  : "border border-rule/70 text-sub"
              } ${isToday ? "outline outline-1 outline-offset-1 outline-ink" : ""}`}
            >
              {d.getUTCDate()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
import { motion, useReducedMotion } from "framer-motion";
import ImpactLine from "@/components/cb/ImpactLine";

const HEAD = ["#", "floor", "bid", "baseline", "to date", "projected", "vol", "uplift", "score"];

function Num({ value, label, strong = false }) {
  return (
    <div className="sm:text-right">
      <div className={`tabular ${strong ? "text-[16px] text-ink" : "text-[13px] text-ink"}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-[0.12em] text-sub sm:hidden">{label}</div>
    </div>
  );
}

/** One row per floor: rank, name, bid, baseline, pace, points and projected score. */
export default function PledgeBoard({ rows, myFloor, dense = false, live = false }) {
  const reduce = useReducedMotion();

  return (
    <div>
      <div
        className={`hidden border-b border-rule pb-2 text-[9px] uppercase tracking-[0.12em] text-sub sm:grid sm:grid-cols-[26px_minmax(0,1fr)_46px_56px_52px_58px_40px_46px_52px] sm:gap-x-3`}
      >
        {HEAD.map((h, i) => (
          <span key={h} className={i > 1 ? "text-right" : ""}>{h}</span>
        ))}
      </div>

      {rows.map((r, i) => {
        const mine = r.code === myFloor;
        return (
          <motion.div
            key={r.code}
            layout={!reduce}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`grid grid-cols-3 items-start gap-x-3 gap-y-2 border-b border-rule px-2 py-3 sm:grid-cols-[26px_minmax(0,1fr)_46px_56px_52px_58px_40px_46px_52px] sm:items-center ${
              mine ? "bg-white" : ""
            } ${dense ? "py-2.5" : ""}`}
            style={mine ? { boxShadow: "inset 2px 0 0 0 hsl(var(--cb-caramel))" } : undefined}
          >
            <span className={`col-span-1 text-[11px] tabular ${mine ? "text-caramel" : "text-sub"}`}>
              {String(r.rank).padStart(2, "0")}
            </span>

            <div className="col-span-2 min-w-0 sm:col-span-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="display text-[19px] sm:text-[21px]">{r.code}</span>
                <span className="truncate text-[11.5px] uppercase tracking-[0.1em] text-sub">{r.name}</span>
                {mine && <span className="text-[9px] uppercase tracking-[0.14em] text-caramel">my floor</span>}
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-sub/90">{r.deptPlay}</p>
            </div>

            <Num value={r.finalBid != null ? `${r.bid}→${r.finalBid}%` : `${r.bid}%`} label="bid" />
            <Num value={r.baselinePer} label="baseline" />
            <Num value={Math.round(r.toDate)} label="to date" />
            <Num value={Math.round(r.projected)} label="projected" />
            <Num value={Math.round(r.volumePts)} label="vol pts" />
            <Num value={Math.round(r.upliftPts)} label="uplift pts" />
            <div className="flex items-center justify-end gap-2 sm:block sm:text-right">
              <span className="display tabular text-[20px] leading-none">{Math.round(r.score)}</span>
              <span className="mt-1 block text-[9px] uppercase tracking-[0.12em] text-sub">
                {r.paceMet ? "on track" : "behind"}
              </span>
            </div>

            <div className="col-span-3 flex flex-wrap items-center gap-x-3 sm:col-span-9">
              <span
                className={`inline-flex h-[20px] items-center rounded-full border px-2 text-[9px] uppercase tracking-[0.1em] ${
                  r.paceMet ? "border-verdant/40 bg-verdant/10 text-verdant" : "border-caramel/40 bg-caramel/10 text-[#8F6539]"
                }`}
              >
                {r.paceMet ? "on track" : "behind"}
              </span>
              <span className="text-[10.5px] text-sub">
                pace {Math.round(r.toDate)} of {Math.round(r.paceTarget)} g per employee · {r.onPaceWeeks} of 4 weeks on pace
              </span>
              <ImpactLine grams={r.projected * r.eligible} eligible={r.eligible} scope="floor" className="ml-auto hidden sm:flex" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
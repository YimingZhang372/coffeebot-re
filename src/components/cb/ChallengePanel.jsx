import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FLOORS } from "@/lib/programme";
import { floorRows } from "@/lib/metrics";
import { useProgramme } from "@/lib/programmeData";
import Pill from "@/components/cb/Pill";
import StatusChip from "@/components/cb/StatusChip";

const fmt = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

export default function ChallengePanel() {
  const { challenges, reuses, eligibleByFloor, me, createChallenge, respondChallenge } = useProgramme();
  const reduce = useReducedMotion();
  const [toFloor, setToFloor] = useState("");
  const [start, setStart] = useState("2026-11-17");
  const [end, setEnd] = useState("2026-11-30");

  const score = (code, startDate, endDate) => {
    const rows = reuses.filter(
      (r) =>
        r.floorCode === code &&
        r.status === "validated" &&
        r.occurredAt.slice(0, 10) >= startDate &&
        r.occurredAt.slice(0, 10) <= endDate
    );
    const grams = rows.reduce((s, r) => s + r.grams, 0);
    const eligible = eligibleByFloor[code] || 1;
    return { grams, per: grams / eligible };
  };

  const active = challenges.filter((c) => c.status === "active");
  const pending = challenges.filter((c) => c.status === "pending");
  const done = challenges.filter((c) => c.status === "completed" || c.status === "declined");

  const isChampion = me?.role === "champion";

  return (
    <div className="space-y-6">
      {active.map((c) => {
        const a = score(c.fromFloor, c.startDate, c.endDate);
        const b = score(c.toFloor, c.startDate, c.endDate);
        const max = Math.max(a.per, b.per, 1);
        const daysLeft = Math.max(0, Math.ceil((new Date(c.endDate) - new Date()) / 86400000));
        return (
          <motion.div
            key={c.id}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-paper p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.14em] text-sub">live · {c.refId}</span>
              <StatusChip status="validated">active</StatusChip>
            </div>
            <h3 className="display mt-2 text-[28px]">{c.fromFloor} vs {c.toFloor}</h3>
            <p className="text-[12px] text-sub">
              {c.metric} · {fmt(c.startDate)} – {fmt(c.endDate)} · {daysLeft} days left
            </p>
            {[c.fromFloor, c.toFloor].map((code) => {
              const s = code === c.fromFloor ? a : b;
              return (
                <div key={code} className="mt-3">
                  <div className="flex items-baseline justify-between text-[12px]">
                    <span className="text-ink">{code}</span>
                    <span className="tabular text-sub">{Math.round(s.per)} g per employee</span>
                  </div>
                  <span className="mt-1 block h-[3px] w-full bg-rule">
                    <motion.span
                      className={`block h-[3px] ${code === me?.floorCode ? "bg-caramel" : "bg-ink"}`}
                      initial={reduce ? false : { width: 0 }}
                      animate={{ width: `${Math.max(2, (s.per / max) * 100)}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  </span>
                </div>
              );
            })}
            <p className="mt-3 text-[12px] text-sub">
              Winner is posted automatically in the feed and in the monthly email.
            </p>
          </motion.div>
        );
      })}

      {pending.map((c) => (
        <div key={c.id} className="border border-dashed border-rule p-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-ink">{c.fromFloor} challenges {c.toFloor}</span>
            <StatusChip status="pending">pending acceptance</StatusChip>
          </div>
          <p className="mt-1 text-[12px] text-sub">
            {c.metric} · {fmt(c.startDate)} – {fmt(c.endDate)} · issued by {c.createdBy}
          </p>
          {me?.role === "champion" && me.floorCode === c.toFloor && (
            <div className="mt-3 flex gap-2">
              <Pill size="sm" onClick={() => respondChallenge(c, true)}>accept challenge</Pill>
              <Pill size="sm" variant="ghost" onClick={() => respondChallenge(c, false)}>decline</Pill>
            </div>
          )}
        </div>
      ))}

      <div>
        <h3 className="border-b border-rule pb-2 text-[15px] lowercase">completed</h3>
        <div className="mt-2">
          {done.map((c) => (
            <div key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule py-2.5 text-[13px]">
              <span className="text-ink">{c.fromFloor} vs {c.toFloor}</span>
              <span className="text-sub">
                {c.status === "completed" ? `${c.winnerFloor} won` : "declined"} · {fmt(c.startDate)} – {fmt(c.endDate)}
              </span>
            </div>
          ))}
          {!done.length && <p className="py-3 text-[13px] text-sub">No completed challenges yet.</p>}
        </div>
      </div>

      {isChampion && (
        <div className="border-t border-rule pt-4">
          <h3 className="text-[15px] lowercase">issue a challenge from {me.floorCode}</h3>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.14em] text-sub">floor</span>
              <select
                value={toFloor}
                onChange={(e) => setToFloor(e.target.value)}
                className="mt-1 h-11 w-[180px] border border-rule bg-white px-3 text-[13px]"
              >
                <option value="">select floor</option>
                {FLOORS.filter((f) => f.code !== me.floorCode).map((f) => (
                  <option key={f.code} value={f.code}>{f.code} · {f.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.14em] text-sub">from</span>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 h-11 border border-rule bg-white px-3 text-[13px]" />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.14em] text-sub">to</span>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 h-11 border border-rule bg-white px-3 text-[13px]" />
            </label>
            <Pill
              size="sm"
              disabled={!toFloor}
              onClick={async () => {
                await createChallenge({ toFloor, startDate: start, endDate: end });
                setToFloor("");
              }}
            >
              send challenge
            </Pill>
          </div>
        </div>
      )}
    </div>
  );
}
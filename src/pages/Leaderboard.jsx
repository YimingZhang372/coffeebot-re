import { useState } from "react";
import { useProgramme } from "@/lib/programmeData";
import { monthLabel } from "@/lib/programme";
import { groundDropState } from "@/lib/groundDrop";
import RankingIndex from "@/components/cb/RankingIndex";
import StatusChip from "@/components/cb/StatusChip";
import CountUp from "@/components/cb/CountUp";
import Marquee from "@/components/cb/Marquee";
import { marqueeItems, publicNudges } from "@/lib/metrics";
import NudgeList from "@/components/cb/NudgeList";

const OFFICES = [
  { id: "marina-bay", name: "Marina Bay", floors: 6, eligible: 150, reusedG: 4040, collectedG: 6085, participants: 61 },
  { id: "changi", name: "Changi Business Park", floors: 4, eligible: 96, reusedG: 2310, collectedG: 3520, participants: 34 },
  { id: "raffles", name: "Raffles Place", floors: 3, eligible: 74, reusedG: 1620, collectedG: 2480, participants: 23 },
];

const BANKS = [
  { name: "Harbourline Bank", offices: 3, eligible: 320, reusedKg: 7.97, participation: 36.9 },
  { name: "Straits Meridian Bank", offices: 2, eligible: 240, reusedKg: 5.12, participation: 28.4 },
];

export default function Leaderboard() {
  const { rows, allRows, myRow, me, month, settings, prevRows, challenges } = useProgramme();
  const [tab, setTab] = useState("floors");
  const [period, setPeriod] = useState("month");
  const st = groundDropState(settings);

  const list = period === "month" ? rows : allRows;
  const activeChallenge = challenges.find((c) => c.status === "active");
  const marquee = marqueeItems({ rows, myRow, nextDropLabel: `${st.nextLabel} · ${st.time}`, challenge: activeChallenge });

  const marina = list.reduce((s, r) => s + r.reused, 0);
  const officeRows = OFFICES.map((o) =>
    o.id === "marina-bay"
      ? { ...o, reusedG: marina, collectedG: list.reduce((s, r) => s + r.collected, 0), participants: list.reduce((s, r) => s + r.participants, 0) }
      : o
  ).sort((a, b) => b.reusedG / b.eligible - a.reusedG / a.eligible);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-sub">leaderboard · {monthLabel(month)}</p>
          <h1 className="display mt-3 text-[54px] sm:text-[88px]">leaderboard.</h1>
        </div>
        <div className="flex items-center gap-2">
          {[["month", "this month"], ["all", "all time"]].map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setPeriod(k)}
              className={`rounded-full border px-4 py-2 text-[12px] lowercase transition-colors ${
                period === k ? "border-ink bg-ink text-white" : "border-rule text-sub hover:border-ink hover:text-ink"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <Marquee items={marquee} className="-mx-5 sm:-mx-8" speed={54} />

      <div className="flex flex-wrap items-center gap-6 border-b border-rule">
        {[["floors", "floors"], ["offices", "offices"], ["banks", "banks"]].map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`relative pb-3 text-[15px] lowercase transition-colors ${tab === k ? "text-ink" : "text-sub hover:text-ink"}`}
          >
            {l}
            {tab === k && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-caramel" />}
          </button>
        ))}
        <span className="ml-auto pb-3 text-[11px] uppercase tracking-[0.14em] text-sub">
          {tab === "floors" ? "kg reused per employee" : tab === "offices" ? "kg reused per eligible employee" : "aggregated only"}
        </span>
      </div>

      {tab === "floors" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <RankingIndex rows={list} myFloor={me?.floorCode} />
            <p className="mt-3 text-[12px] text-sub">
              Monthly reset. Participation counts colleagues who collected or reported a reuse this period, against{" "}
              {myRow?.target || 30}% of eligible employees per floor.
            </p>
          </div>
          <div className="space-y-6">
            <div className="bg-paper p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sub">floor of the month</p>
              <p className="display mt-2 text-[38px]">{list[0]?.code}</p>
              <p className="text-[13px] text-ink">{list[0]?.name}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-sub">
                Announced in the Sustainability team&rsquo;s monthly email. Prize for {monthLabel(month)}: team
                breakfast funded by Harbourline, or a donation to a charity chosen by the floor. Funded by the bank,
                never by CoffeeBot.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <StatusChip status="pending">provisional</StatusChip>
                <span className="text-[11px] text-sub">decided on the last working day at 18:00</span>
              </div>
            </div>

            <div>
              <p className="border-b border-rule pb-2 text-[11px] uppercase tracking-[0.14em] text-sub">change vs last month</p>
              <ul className="mt-2 space-y-1.5">
                {list.map((r) => {
                  const prev = prevRows.find((p) => p.code === r.code);
                  const diff = prev ? prev.rank - r.rank : 0;
                  return (
                    <li key={r.code} className="flex items-baseline justify-between text-[12px]">
                      <span className="text-ink">{r.code}</span>
                      <span className={`tabular ${diff > 0 ? "text-verdant" : diff < 0 ? "text-[#A44A3F]" : "text-sub"}`}>
                        {diff > 0 ? `up ${diff}` : diff < 0 ? `down ${Math.abs(diff)}` : "no change"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <NudgeList items={publicNudges({ rows, myRow, monthLabel: monthLabel(month), daysLeft: 22 })} />
          </div>
        </div>
      )}

      {tab === "offices" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {officeRows.map((o, i) => (
            <div key={o.id} className="bg-paper p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] tabular text-sub">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[11px] uppercase tracking-[0.12em] text-sub">{o.floors} floors</span>
              </div>
              <p className="display mt-2 text-[26px] leading-none">{o.name}</p>
              <p className="mt-3 display text-[40px]">
                <CountUp value={o.reusedG / 1000} decimals={2} />
                <span className="ml-1 text-[14px] lowercase tracking-normal">kg</span>
              </p>
              <p className="text-[12px] text-sub">
                {Math.round(o.reusedG / o.eligible)} g per eligible employee · {o.participants} of {o.eligible} participating
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "banks" && (
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {BANKS.map((b, i) => (
              <div key={b.name} className="bg-paper p-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] tabular text-sub">{String(i + 1).padStart(2, "0")}</span>
                  <StatusChip status="neutral">{b.offices} offices</StatusChip>
                </div>
                <p className="display mt-2 text-[26px] leading-none">{b.name}</p>
                <p className="mt-3 display text-[40px]">
                  <CountUp value={b.reusedKg} decimals={2} />
                  <span className="ml-1 text-[14px] lowercase tracking-normal">kg</span>
                </p>
                <p className="text-[12px] text-sub">
                  {b.eligible} eligible employees · {b.participation}% participating
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-sub">
            Inter-bank comparison is aggregated only. No individual employee or floor data leaves Harbourline.
            Straits Meridian&rsquo;s figures are reported to CoffeeBot under the same evidence standard.
          </p>
        </div>
      )}
    </div>
  );
}
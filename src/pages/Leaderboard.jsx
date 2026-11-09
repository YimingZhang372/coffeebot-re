import { useState } from "react";
import { useProgramme } from "@/lib/programmeData";
import { monthLabel } from "@/lib/programme";
import { monthTitle, shortDate, clockLabel } from "@/lib/pledge";
import PledgeBoard from "@/components/pledge/PledgeBoard";
import StatusChip from "@/components/cb/StatusChip";
import CountUp from "@/components/cb/CountUp";
import Marquee from "@/components/cb/Marquee";
import { marqueeItems, publicNudges } from "@/lib/metrics";
import NudgeList from "@/components/cb/NudgeList";
import ImpactLine from "@/components/cb/ImpactLine";

const OTHER_OFFICES = [
  { id: "changi", name: "Changi Business Park", floors: 4, eligible: 96, monthG: 1420, allG: 8200, monthP: 21, allP: 34 },
  { id: "raffles", name: "Raffles Place", floors: 3, eligible: 74, monthG: 980, allG: 5400, monthP: 14, allP: 23 },
];

const OTHER_BANK = { name: "Straits Meridian Bank", offices: 2, eligible: 240, monthKg: 3.94, allKg: 21.6, monthP: 12.8, allP: 22.1 };

const PAST_MONTHS = [
  { key: "2026-10", note: "Pre-auction ranking by g reused per employee. Pledge Auction starts in November." },
  { key: "2026-09", note: "Pre-auction ranking by g reused per employee. Pledge Auction starts in November." },
];

export default function Leaderboard() {
  const { rows, allRows, myRow, me, month, board, config, rowsFor, settings } = useProgramme();
  const [tab, setTab] = useState("floors");
  const [past, setPast] = useState("");
  const [period, setPeriod] = useState("month");

  const marquee = marqueeItems({ board, config, month });

  const pastMeta = PAST_MONTHS.find((p) => p.key === past);
  const pastRows = past ? rowsFor(past) : null;

  const list = period === "month" ? rows : allRows;
  const marinaReused = list.reduce((s, r) => s + r.reused, 0);
  const marinaParticipants = list.reduce((s, r) => s + r.participants, 0);

  const officeRows = [
    { id: "marina-bay", name: "Marina Bay", floors: 6, eligible: 150, reusedG: marinaReused, participants: marinaParticipants },
    ...OTHER_OFFICES.map((o) => ({
      ...o,
      reusedG: period === "month" ? o.monthG : o.allG,
      participants: period === "month" ? o.monthP : o.allP,
    })),
  ].sort((a, b) => b.reusedG / b.eligible - a.reusedG / a.eligible);

  const banks = [
    {
      name: "Harbourline Bank",
      offices: 3,
      eligible: 320,
      reusedKg: officeRows.reduce((s, o) => s + o.reusedG, 0) / 1000,
      participation: (officeRows.reduce((s, o) => s + o.participants, 0) / 320) * 100,
    },
    {
      name: OTHER_BANK.name,
      offices: OTHER_BANK.offices,
      eligible: OTHER_BANK.eligible,
      reusedKg: period === "month" ? OTHER_BANK.monthKg : OTHER_BANK.allKg,
      participation: period === "month" ? OTHER_BANK.monthP : OTHER_BANK.allP,
    },
  ];

  const leader = board[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-sub">leaderboard · {monthLabel(month)}</p>
          <h1 className="display mt-3 text-[54px] sm:text-[88px]">leaderboard.</h1>
        </div>
        {tab === "floors" ? (
          <label className="flex items-center gap-2 text-[12px] text-sub">
            <span className="uppercase tracking-[0.12em]">past months</span>
            <select
              value={past}
              onChange={(e) => setPast(e.target.value)}
              className="h-9 border border-rule bg-white px-2 text-[12px] lowercase"
            >
              <option value="">this month · pledge auction</option>
              {PAST_MONTHS.map((p) => (
                <option key={p.key} value={p.key}>{monthTitle(p.key).toLowerCase()}</option>
              ))}
            </select>
          </label>
        ) : (
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
        )}
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
          {tab !== "floors"
            ? tab === "offices"
              ? "kg reused per eligible employee"
              : "aggregated only"
            : past
            ? "g reused per employee"
            : "projected pledge score"}
        </span>
      </div>

      {tab === "floors" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div>
            {past ? (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
                  <h2 className="text-[15px] lowercase">{monthTitle(past)} ranking</h2>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-sub">closed month</span>
                </div>
                <ul className="mt-1">
                  {(pastRows || []).map((r) => (
                    <li key={r.code} className="flex items-center gap-4 border-b border-rule py-3">
                      <span className="w-6 text-[12px] tabular text-sub">{String(r.rank).padStart(2, "0")}</span>
                      <span className="display text-[19px]">{r.code}</span>
                      <span className="truncate text-[12px] uppercase tracking-[0.1em] text-sub">{r.name}</span>
                      <span className="ml-auto tabular text-[15px] text-ink">{Math.round(r.perEmployee)}</span>
                      <span className="w-[86px] text-right text-[9px] uppercase tracking-[0.12em] text-sub">g / employee</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[12px] text-sub">{pastMeta?.note}</p>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
                  <h2 className="text-[15px] lowercase">this month&rsquo;s league</h2>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-sub">pledge auction · projected</span>
                </div>
                <div className="mt-3">
                  <PledgeBoard rows={board} myFloor={me?.floorCode} />
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-sub">
                  Ranked by projected pledge score: half volume, half uplift against each floor&rsquo;s own bid. A
                  validation anywhere moves the board immediately.
                </p>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-paper p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sub">floor of the month</p>
              <p className="display mt-2 text-[38px]">{leader?.code}</p>
              <p className="text-[13px] text-ink">{leader?.name}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-sub">
                Decided {shortDate(config.monthCloseAt)}, 18:00 · Team breakfast funded by Harbourline. The winner is on{" "}
                {Math.round(leader?.score || 0)} projected, {leader?.paceMet ? "on track" : "behind"} on its{" "}
                {leader?.bid}% bid.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <StatusChip status="pending">provisional</StatusChip>
                <span className="text-[11px] text-sub">
                  closes {shortDate(config.monthCloseAt)} {clockLabel(config.monthCloseAt)}
                </span>
              </div>
            </div>

            {!past && (
              <div>
                <p className="border-b border-rule pb-2 text-[11px] uppercase tracking-[0.14em] text-sub">change vs october</p>
                <ul className="mt-2 space-y-1.5">
                  {board.map((r) => {
                    const prev = rowsFor("2026-10").find((p) => p.code === r.code);
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
            )}

            <NudgeList items={publicNudges({ rows, myRow, monthLabel: monthLabel(month), daysLeft: 21 })} />
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
              <ImpactLine grams={o.reusedG} scope="office" className="mt-1" />
              <p className="mt-1 text-[12px] text-sub">
                {Math.round(o.reusedG / o.eligible)} g per eligible employee · {o.participants} of {o.eligible} participating
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "banks" && (
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {banks.map((b, i) => (
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
                <ImpactLine grams={b.reusedKg * 1000} scope="office" className="mt-1" />
                <p className="mt-1 text-[12px] text-sub">
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
import { FLOORS, DOW_SHORT, MONTH_NAMES, formatSgt, monthLabel } from "./programme";

/** The pledge auction rules, defaults and the one place every derived figure is computed. */

export const PLEDGE_DEFAULTS = {
  pledgeNightAt: "2026-10-30T17:30:00+08:00",
  finalBidOpenAt: "2026-11-23T09:00:00+08:00",
  finalBidCloseAt: "2026-11-24T10:00:00+08:00",
  monthCloseAt: "2026-11-30T18:00:00+08:00",
  nextPledgeNightAt: "2026-11-27T17:30:00+08:00",
  multipliers: { met: 1.25, missed: 0.75, finalMet: 1.5, finalMissed: 0.5 },
  caps: { volume: 50, uplift: 50 },
};

export const DROPS_PER_MONTH = 4;

export const DEPT_PLAY = {
  L8: "Audit desk: spot-checks 10% of posts across floors.",
  L9: "Market maker: runs the Pledge board.",
  L10: "Branch window: desk and branch-lobby plants fed with grounds.",
  L11: "Auto-check: pre-screens reuse photos.",
  L12: "Reconciliation: matches weighed vs reported kg before certificates.",
  L14: "Onboarding: every new joiner gets a starter pouch and a desk plant.",
};

export const STEPS = [
  { n: "01", title: "Pledge night", body: "Before each month, every floor's Champion publicly bids the uplift it will reach, as a % more g reused per employee than its baseline." },
  { n: "02", title: "The month", body: "Weekly Ground Drops. Each floor sees its pace against its own pledge, never anyone else's." },
  { n: "03", title: "Final bid", body: "In the last Ground Drop week a floor may raise its bid once. It can never lower it." },
  { n: "04", title: "Score", body: "Half volume, half uplift. The highest score is Floor of the Month." },
];

/** Demo floors for the public sandbox round. */
export const SANDBOX_FLOORS = [
  { floor: "A", code: "L8", baseline: 60, weeks: [50, 55, 62, 68], result: 78 },
  { floor: "B", code: "L9", baseline: 90, weeks: [88, 92, 90, 91], result: 95 },
  { floor: "C", code: "L10", baseline: 40, weeks: [30, 38, 45, 52], result: 60 },
  { floor: "D", code: "L11", baseline: 110, weeks: [120, 105, 95, 90], result: 99 },
];

const DAY = 86400000;

export function shiftMonth(key, delta) {
  const [y, m] = String(key).split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function pledgeConfig(settings, totalEligible = 150) {
  const p = { ...PLEDGE_DEFAULTS, ...(settings?.pledge || {}) };
  const impacts = { gramsPerCoffee: 15, drinksPerMonth: 3000, workingDays: 22, ...(settings?.impacts || {}) };
  const volunteer = { hoursPerActivity: 0.5, monthlyCap: 1, annualCap: 12, leaveAt: 10, ...(settings?.volunteer || {}) };
  return {
    ...p,
    multipliers: { ...PLEDGE_DEFAULTS.multipliers, ...(p.multipliers || {}) },
    caps: { ...PLEDGE_DEFAULTS.caps, ...(p.caps || {}) },
    impacts,
    volunteer,
    /** 3,000 drinks × 15 g ÷ 150 employees = 300 g per employee per month. */
    perEmployeeCapG: Math.round((impacts.drinksPerMonth * impacts.gramsPerCoffee) / Math.max(1, totalEligible)),
    groundsPerMonthG: impacts.drinksPerMonth * impacts.gramsPerCoffee,
  };
}

export const bidFor = (pledges, month, code) =>
  pledges.find((p) => p.month === month && p.floorCode === code) || null;

/** The floor's best month of the three before `month` (g reused per employee). */
export function baselineFor(rowsFor, code, month) {
  const months = [1, 2, 3].map((i) => shiftMonth(month, -i));
  const options = months.map((m) => {
    const row = rowsFor(m).find((r) => r.code === code);
    return { month: m, per: row?.perEmployee || 0 };
  });
  return options.sort((a, b) => b.per - a.per)[0] || { month: months[0], per: 0 };
}

/** Ground Drops already held in a month, capped at the four that count. */
export function dropsDoneIn(month, settings, now = new Date()) {
  const day = settings?.groundDropDay ?? 2;
  const time = settings?.groundDropTime || "10:00";
  const [hh, mm] = time.split(":").map(Number);
  const [y, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const instants = [];
  for (let d = 1; d <= days; d++) {
    const at = Date.UTC(y, m - 1, d, hh - 8, mm, 0);
    if (new Date(at).getUTCDay() === day) instants.push(at);
  }
  const done = instants.filter((t) => t <= now.getTime()).length;
  return Math.min(DROPS_PER_MONTH, done);
}

/** The Ground Drop instants of a month, in SGT. */
export function dropInstants(month, settings) {
  const day = settings?.groundDropDay ?? 2;
  const time = settings?.groundDropTime || "10:00";
  const [hh, mm] = time.split(":").map(Number);
  const [y, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out = [];
  for (let d = 1; d <= days; d++) {
    const at = Date.UTC(y, m - 1, d, hh - 8, mm, 0);
    if (new Date(at).getUTCDay() === day) out.push(at);
  }
  return out;
}

/** Weeks in which the floor's cumulative reuse reached its pledge pace, from the records. */
export function weeksOnPace({ reuses, month, code, eligible, baselinePer, bidPct, dropsDone, settings }) {
  if (!dropsDone) return 0;
  const target = baselinePer * (1 + bidPct / 100);
  const instants = dropInstants(month, settings);
  let count = 0;
  for (let w = 1; w <= dropsDone; w++) {
    const cutoff = instants[w - 1] ?? Date.now();
    const grams = reuses
      .filter(
        (r) =>
          r.status === "validated" &&
          r.floorCode === code &&
          String(r.occurredAt).slice(0, 7) === month &&
          new Date(r.occurredAt).getTime() <= cutoff
      )
      .reduce((s, r) => s + (r.grams || 0), 0);
    if (grams / Math.max(1, eligible) >= (target * w) / DROPS_PER_MONTH) count++;
  }
  return count;
}

export function scoreFor({ projected, baselinePer, bidPct, finalBid, config }) {
  const { caps, multipliers, perEmployeeCapG } = config;
  const volumePts = Math.min(caps.volume, (projected / Math.max(1, perEmployeeCapG)) * 100);
  const upliftPct = baselinePer ? ((projected - baselinePer) / baselinePer) * 100 : 0;
  const effective = finalBid ?? bidPct;
  const met = upliftPct >= effective;
  const factor = finalBid != null
    ? (met ? multipliers.finalMet : multipliers.finalMissed)
    : (met ? multipliers.met : multipliers.missed);
  const upliftPts = Math.max(0, Math.min(caps.uplift, upliftPct * factor));
  return {
    volumePts,
    upliftPct,
    upliftPts,
    effectiveBid: effective,
    met,
    score: volumePts + upliftPts,
  };
}

/**
 * The November league. Everything is computed from collection and reuse records,
 * the floor's own Pledge bid, and the programme inputs.
 */
export function auctionBoard({ month, rows, rowsFor, pledges, config, dropsDone, reuses = [], settings, now = new Date() }) {
  const list = FLOORS.map((f) => {
    const row = rows.find((r) => r.code === f.code) || { code: f.code, name: f.name, eligible: f.eligible, perEmployee: 0 };
    const pledge = bidFor(pledges, month, f.code);
    const baseline = baselineFor(rowsFor, f.code, month);
    const bidPct = pledge?.openingBid ?? 0;
    const finalBid = pledge?.finalBid ?? null;
    const toDate = row.perEmployee;
    const projected = dropsDone > 0 ? toDate * (DROPS_PER_MONTH / dropsDone) : 0;
    const scored = scoreFor({ projected, baselinePer: baseline.per, bidPct, finalBid, config });
    const paceTarget = baseline.per * (1 + (finalBid ?? bidPct) / 100);
    const paceNeeded = (paceTarget * dropsDone) / DROPS_PER_MONTH;
    return {
      code: f.code,
      name: f.name,
      eligible: row.eligible,
      toDate,
      projected,
      bid: bidPct,
      finalBid,
      baselinePer: Math.round(baseline.per),
      baselineMonth: baseline.month,
      paceTarget,
      paceMet: toDate >= paceNeeded,
      onPaceWeeks: weeksOnPace({
        reuses, month, code: f.code, eligible: row.eligible,
        baselinePer: baseline.per, bidPct: finalBid ?? bidPct, dropsDone, settings,
      }),
      deptPlay: DEPT_PLAY[f.code],
      hasPledge: !!pledge,
      ...scored,
    };
  });

  return list
    .sort((a, b) => b.score - a.score || b.onPaceWeeks - a.onPaceWeeks || b.projected - a.projected)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export const pct = (n) => `${n > 0 ? "+" : ""}${Math.round(n)}%`;
export const pts = (n) => (Math.round(n * 10) / 10).toFixed(1);

/** Marquee lines, all from live figures. */
export function pledgeMarquee({ board, config, month }) {
  const items = [];
  const out = board || [];
  const tracked = out.filter((r) => r.hasPledge);
  if (tracked.length) {
    const onTrack = tracked.filter((r) => r.paceMet);
    const lead = onTrack.find((r) => r.code === "L10") || onTrack[0] || tracked[0];
    items.push(`${lead.code} is ${lead.paceMet ? "on track" : "behind"} for ${pct(lead.effectiveBid)}`);
    const behind = tracked.filter((r) => !r.paceMet).sort((a, b) => a.rank - b.rank)[0];
    if (behind) {
      const needed = Math.max(1, Math.ceil(behind.baselinePer * (1 + behind.effectiveBid / 100) - behind.toDate));
      items.push(`${behind.code} needs ${needed} g per employee to meet its pledge`);
    } else {
      const second = tracked.find((r) => r.code !== lead.code);
      if (second) items.push(`${lead.code} leads ${second.code} on projected score`);
    }
  }
  items.push(`final bid opens ${shortDate(config.finalBidOpenAt)}`);
  items.push(`floor of the month decided ${shortDate(config.monthCloseAt)}, 18:00`);
  return items;
}

export function shortDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const parts = d.toLocaleDateString("en-GB", {
    timeZone: "Asia/Singapore", weekday: "short", day: "numeric", month: "short",
  });
  return parts.replace(",", "").toLowerCase();
}

export function clockLabel(iso) {
  return new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Asia/Singapore", hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Countdown text + phase for the pledge page header. */
export function bidPhase(config, now = new Date()) {
  const t = now.getTime();
  const open = new Date(config.finalBidOpenAt).getTime();
  const close = new Date(config.finalBidCloseAt).getTime();
  const monthClose = new Date(config.monthCloseAt).getTime();
  if (t < open) {
    return { phase: "before", label: "final bid opens", at: config.finalBidOpenAt, ms: open - t, open: false, canRaise: false };
  }
  if (t < close) {
    return { phase: "open", label: "final bid closes", at: config.finalBidCloseAt, ms: close - t, open: true, canRaise: true };
  }
  if (t < monthClose) {
    return { phase: "closed", label: "month closes", at: config.monthCloseAt, ms: monthClose - t, open: false, canRaise: false };
  }
  return { phase: "decided", label: "decided", at: config.monthCloseAt, ms: 0, open: false, canRaise: false };
}

export function countdownParts(ms) {
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { d, h, m, s };
}

export function monthTitle(key) {
  const [y, m] = key.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function sandboxScore(floor, bid, result) {
  const volumePts = Math.min(50, (result / 300) * 100);
  const upliftPct = floor.baseline ? ((result - floor.baseline) / floor.baseline) * 100 : 0;
  const met = upliftPct >= bid;
  const upliftPts = Math.max(0, Math.min(50, upliftPct * (met ? 1.25 : 0.75)));
  return { volumePts, upliftPct, upliftPts, met, score: volumePts + upliftPts };
}

export { monthLabel, formatSgt };
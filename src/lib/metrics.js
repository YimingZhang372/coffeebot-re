import { FLOORS } from "./programme";

export const monthOf = (iso) => String(iso || "").slice(0, 7);

export function currentMonth() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 7);
}

/** Per-floor figures for one month (month = null → all time). Sorted by kg reused per employee. */
export function floorRows({ month, reuses = [], collections = [], eligibleByFloor = {}, participationTarget = 30 }) {
  return FLOORS.map((f) => {
    const eligible = eligibleByFloor[f.code] ?? f.eligible;
    const cRows = collections.filter(
      (c) => c.floorCode === f.code && (!month || monthOf(c.occurredAt) === month)
    );
    const rRows = reuses.filter(
      (r) => r.floorCode === f.code && (!month || monthOf(r.occurredAt) === month)
    );
    const validated = rRows.filter((r) => r.status === "validated");
    const collected = cRows.reduce((s, c) => s + (c.grams || 0), 0);
    const reused = validated.reduce((s, r) => s + (r.grams || 0), 0);
    const people = new Set([...cRows.map((c) => c.employeeEmail), ...rRows.map((r) => r.employeeEmail)]);
    const posts = validated.length;
    return {
      code: f.code,
      name: f.name,
      eligible,
      collected,
      reused,
      perEmployee: eligible ? reused / eligible : 0,
      participation: eligible ? (people.size / eligible) * 100 : 0,
      participants: people.size,
      posts,
      reuseRate: collected ? (reused / collected) * 100 : 0,
      target: participationTarget,
    };
  })
    .sort((a, b) => b.perEmployee - a.perEmployee)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export function officeTotals(rows) {
  const collected = rows.reduce((s, r) => s + r.collected, 0);
  const reused = rows.reduce((s, r) => s + r.reused, 0);
  const eligible = rows.reduce((s, r) => s + r.eligible, 0);
  const participants = rows.reduce((s, r) => s + r.participants, 0);
  return {
    collected,
    reused,
    diverted: reused,
    eligible,
    participants,
    reuseRate: collected ? (reused / collected) * 100 : 0,
    participation: eligible ? (participants / eligible) * 100 : 0,
    aboveTarget: rows.filter((r) => r.participation >= rows[0]?.target).length,
  };
}

export function myFloor(rows, code) {
  return rows.find((r) => r.code === code) || rows[rows.length - 1];
}

/** Public, floor-level nudges — never names an individual. */
export function publicNudges({ rows, myRow, monthLabel, daysLeft }) {
  if (!myRow) return [];
  const idx = rows.findIndex((r) => r.code === myRow.code);
  const above = rows[idx - 1];
  const below = rows[idx + 1];
  const out = [];
  if (above) {
    const gap = Math.max(1, Math.round(above.perEmployee - myRow.perEmployee));
    out.push(`${above.code} is ${gap} g per employee ahead of ${myRow.code}. One more reuse would close most of that.`);
  } else {
    out.push(
      below
        ? `${myRow.code} leads the office by ${Math.max(1, Math.round(myRow.perEmployee - below.perEmployee))} g per employee over ${below.code}.`
        : `${myRow.code} leads the office on g reused per employee.`
    );
  }
  const needed = Math.ceil((myRow.target / 100) * myRow.eligible) - myRow.participants;
  if (needed > 0) {
    out.push(`${myRow.code} is at ${Math.round(myRow.participation)}% participation. ${needed} more ${needed === 1 ? "colleague" : "colleagues"} needed to reach the ${myRow.target}% target.`);
  }
  if (below) {
    out.push(`${below.code} has posted ${below.posts} reuses this month. ${myRow.code} has posted ${myRow.posts}.`);
  }
  out.push(`Floor of the Month for ${monthLabel} is decided on the last working day at 18:00.`);
  return out;
}

export function marqueeItems({ rows, myRow, nextDropLabel, challenge }) {
  const items = [];
  if (rows[0]) items.push(`${rows[0].code} leads the office on kg per employee`);
  if (myRow) {
    const idx = rows.findIndex((r) => r.code === myRow.code);
    const above = rows[idx - 1];
    if (above) items.push(`${above.code} is ${Math.max(1, Math.round(above.perEmployee - myRow.perEmployee))} g per employee ahead of ${myRow.code}`);
    const needed = Math.ceil((myRow.target / 100) * myRow.eligible) - myRow.participants;
    if (needed > 0) items.push(`${needed} more ${needed === 1 ? "colleague" : "colleagues"} for ${myRow.code} to hit ${myRow.target}%`);
  }
  if (nextDropLabel) items.push(`next ground drop ${nextDropLabel}`);
  if (challenge) items.push(`${challenge.fromFloor} vs ${challenge.toFloor} challenge live`);
  return items;
}
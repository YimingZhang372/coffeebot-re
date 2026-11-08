import { DOW_SHORT, formatSgt } from "./programme";
import { nowSgt } from "./programme";

const DAY = 86400000;

/** Compute the live Ground Drop state for the Marina Bay office. */
export function groundDropState(settings, now = new Date()) {
  const day = settings?.groundDropDay ?? 2;
  const time = settings?.groundDropTime || "10:00";
  const [hh, mm] = time.split(":").map(Number);
  const sgt = new Date(now.getTime() + 8 * 3600000);
  const baseUtc = Date.UTC(sgt.getUTCFullYear(), sgt.getUTCMonth(), sgt.getUTCDate(), hh - 8, mm, 0);
  const todayDow = sgt.getUTCDay();
  let diff = (day - todayDow + 7) % 7;
  let dropStart = baseUtc + diff * DAY;
  // If today is the drop day but the caddy window has already closed (clear-out passed), move on a week.
  const clearOut = dropStart + 2 * DAY;
  if (now.getTime() > clearOut + 18 * 3600000) dropStart += 7 * DAY;

  const nextDrop = new Date(dropStart);
  const nextClearOut = new Date(dropStart + 2 * DAY);
  const isToday = todayDow === day && now.getTime() >= dropStart && now.getTime() < dropStart + 12 * 3600000;
  const isWindow = now.getTime() >= dropStart && now.getTime() < nextClearOut + 18 * 3600000;

  const target = isWindow ? nextDrop : nextDrop;
  const ms = Math.max(0, target.getTime() - now.getTime());
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);

  const nextLabel = `${DOW_SHORT[nextDrop.getDay()]} ${nextDrop.getDate()} ${nextDrop.toLocaleDateString("en-GB", { month: "short", timeZone: "Asia/Singapore" }).toLowerCase()}`;

  return {
    state: isToday ? "today" : "upcoming",
    windowOpen: isWindow,
    nextDrop,
    nextClearOut,
    nextLabel,
    clearOutLabel: `${DOW_SHORT[nextClearOut.getDay()]} ${nextClearOut.getDate()} ${nextClearOut.toLocaleDateString("en-GB", { month: "short", timeZone: "Asia/Singapore" }).toLowerCase()}`,
    countdown: `${d} d ${String(h).padStart(2, "0")} h ${String(m).padStart(2, "0")} m ${String(s).padStart(2, "0")} s`,
    time,
    day,
  };
}

/** The next `count` drop/clear-out dates for the calendar strip. */
export function groundDropCalendar(settings, count = 4) {
  const day = settings?.groundDropDay ?? 2;
  const out = [];
  const sgt = nowSgt();
  const todayUtc = Date.UTC(sgt.getUTCFullYear(), sgt.getUTCMonth(), sgt.getUTCDate());
  let diff = (day - sgt.getUTCDay() + 7) % 7;
  let first = todayUtc + diff * DAY;
  for (let i = 0; i < count; i++) {
    const drop = new Date(first + i * 7 * DAY);
    out.push({ drop, clearOut: new Date(drop.getTime() + 2 * DAY) });
  }
  return out;
}

export function icsForGroundDrop(settings) {
  const st = groundDropState(settings);
  const day = settings?.groundDropDay ?? 2;
  const [hh, mm] = (settings?.groundDropTime || "10:00").split(":").map(Number);
  const start = st.nextDrop;
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const end = new Date(start.getTime() + 3600000);
  const byDay = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][day];
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CoffeeBot Re//Ground Drop//EN",
    "BEGIN:VEVENT",
    `UID:grounddrop-${fmt(start)}@coffeebot.re`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    "SUMMARY:CoffeeBot Ground Drop — Harbourline Marina Bay",
    "LOCATION:Floor collection table",
    "DESCRIPTION:Grounds are restocked on the lidded caddy at each floor collection table. Bring a container.",
    `RRULE:FREQ=WEEKLY;BYDAY=${byDay};COUNT=52`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(settings) {
  const blob = new Blob([icsForGroundDrop(settings)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "coffeebot-ground-drop.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export { formatSgt };
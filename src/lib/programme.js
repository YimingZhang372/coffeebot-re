export const FLOORS = [
  { code: "L8", name: "Risk & Compliance", dept: "Risk & Compliance", eligible: 26 },
  { code: "L9", name: "Treasury", dept: "Treasury", eligible: 22 },
  { code: "L10", name: "Retail Operations", dept: "Retail Operations", eligible: 31 },
  { code: "L11", name: "Technology", dept: "Technology", eligible: 29 },
  { code: "L12", name: "Finance & Legal", dept: "Finance & Legal", eligible: 24 },
  { code: "L14", name: "HR & Leadership", dept: "HR & Leadership", eligible: 18 },
];

export const FLOOR_CODES = FLOORS.map((f) => f.code);

export const floorByCode = (code) => FLOORS.find((f) => f.code === code) || FLOORS[0];
export const floorLabel = (code) => {
  const f = floorByCode(code);
  return `${f.code} · ${f.name}`;
};

export const OFFICES = [
  { id: "marina-bay", name: "Marina Bay", floors: FLOOR_CODES, eligible: 150, primary: true },
  { id: "changi", name: "Changi Business Park", floors: [], eligible: 96 },
  { id: "raffles", name: "Raffles Place", floors: [], eligible: 74 },
];

export const ACTIVITIES = [
  {
    key: "plant",
    name: "Plant fertiliser",
    tag: "wet grounds",
    photo: "plant",
    time: "10 min",
    difficulty: "Easy",
    wetFriendly: true,
    summary: "Work a thin layer of wet grounds into the topsoil of established indoor plants.",
    steps: [
      "Loosen the top 2 cm of soil with a fork.",
      "Scatter a 5 mm layer of grounds around the stem, away from the base.",
      "Water lightly so the grounds bind with the soil.",
    ],
    safety: "Keep grounds 3 cm clear of the stem to avoid mould. Not suitable for seedlings.",
  },
  {
    key: "compost",
    name: "Compost booster",
    tag: "wet grounds",
    photo: "compost",
    time: "15 min",
    difficulty: "Easy",
    wetFriendly: true,
    summary: "Grounds are a green material: layer them with dry browns to heat the pile.",
    steps: [
      "Add grounds in a 1:3 ratio with dry leaves, cardboard or shredded paper.",
      "Turn the pile once to aerate.",
      "Cover and leave for two weeks before the next turn.",
    ],
    safety: "Wear gloves. Do not add grounds to a sealed bin without browns, it will turn anaerobic.",
  },
  {
    key: "mushrooms",
    name: "Oyster mushroom kit",
    tag: "wet grounds",
    photo: "mushrooms",
    time: "20 min setup",
    difficulty: "Moderate",
    wetFriendly: true,
    summary: "Pasteurised grounds are a substrate for oyster mushrooms; harvest in 10 to 14 days.",
    steps: [
      "Mix grounds with spawn in the supplied bag, roughly one part spawn to four parts grounds.",
      "Seal and keep in a dark, warm spot for 10 days to colonise.",
      "Cut a 4 cm slit, mist twice daily, and harvest when the caps flatten.",
    ],
    safety: "Wash hands before handling spawn. Discard the block if it turns green or smells sour.",
  },
  {
    key: "deodoriser",
    name: "Fridge deodoriser",
    tag: "dried grounds",
    photo: "deodoriser",
    time: "2 days drying",
    difficulty: "Easy",
    wetFriendly: false,
    summary: "Dried grounds absorb odours. Needs two days of drying before use.",
    steps: [
      "Spread grounds on a tray and dry in sun or a warm room for 48 hours.",
      "Fill a breathable pouch or open jar.",
      "Place on a fridge shelf and replace every three weeks.",
    ],
    safety: "Only use fully dry grounds. Wet grounds in a fridge will grow mould.",
  },
  {
    key: "scrub",
    name: "Coffee soap bar",
    tag: "dried grounds",
    photo: "scrub",
    time: "45 min cure",
    difficulty: "Moderate",
    wetFriendly: false,
    summary: "Dried grounds make a gentle exfoliant in a cold-process or melt-and-pour soap base.",
    steps: [
      "Dry grounds fully, then grind to a coarse powder.",
      "Melt a plain soap base and stir in grounds at roughly 5 per cent by weight.",
      "Pour into a mould and cure for 24 hours before use.",
    ],
    safety: "Do not use on broken skin. Keep the bar dry between uses.",
  },
];

export const activityByKey = (key) => ACTIVITIES.find((a) => a.key === key) || ACTIVITIES[0];

/** Singapore time helpers — all programme timestamps are SGT (UTC+8). */
export const SGT_OFFSET_MS = 8 * 60 * 60 * 1000;

export function sgtParts(date = new Date()) {
  const d = new Date(new Date(date).getTime() + SGT_OFFSET_MS);
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth(),
    d: d.getUTCDate(),
    hh: d.getUTCHours(),
    mm: d.getUTCMinutes(),
    dow: d.getUTCDay(),
  };
}

export function nowSgt() {
  return new Date(Date.now() + SGT_OFFSET_MS);
}

export function formatSgt(date, withTime = true) {
  if (!date) return "—";
  const d = new Date(date);
  const day = d.toLocaleDateString("en-GB", {
    timeZone: "Asia/Singapore",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  if (!withTime) return day;
  const time = d.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Singapore",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${day}, ${time} SGT`;
}

export function monthKey(date = new Date()) {
  const p = sgtParts(date);
  return `${p.y}-${String(p.m + 1).padStart(2, "0")}`;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export const km = (grams) => grams / 1000;
export const kgLabel = (grams, digits = 2) => `${(grams / 1000).toFixed(digits)} kg`;
export const gLabel = (grams) => `${Math.round(grams || 0)} g`;

export function timeAgo(date) {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} d ago`;
  return formatSgt(date, false);
}

export function pad3(n) {
  return String(n).padStart(3, "0");
}

export function recordId(prefix, seq) {
  return `${prefix}-2026-${pad3(seq).padStart(5, "0")}`;
}

/** Next occurrence (in SGT) of a given weekday at a given hour. */
export function nextWeekday(dow, hour = 10) {
  const now = new Date();
  const base = new Date(now.getTime() + SGT_OFFSET_MS);
  const result = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), hour - 8, 0, 0));
  const cur = base.getUTCDay();
  let add = (dow - cur + 7) % 7;
  if (add === 0 && base.getUTCHours() >= hour) add = 7;
  return new Date(result.getTime() + add * 86400000);
}

export const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Volunteer time earned from validated activities, capped per month and per year. */
export function volunteerHours(reuses = [], config = {}) {
  const monthlyCap = Number.isFinite(config.monthlyCap) ? config.monthlyCap : 1;
  const perActivity = Number.isFinite(config.hoursPerActivity) ? config.hoursPerActivity : 0.5;
  const annualCap = Number.isFinite(config.annualCap) ? config.annualCap : 12;

  const perMonth = {};
  reuses
    .filter((r) => r.status === "validated" && r.occurredAt)
    .forEach((r) => {
      const key = String(r.occurredAt).slice(0, 7);
      perMonth[key] = (perMonth[key] || 0) + 1;
    });

  const months = Object.entries(perMonth)
    .map(([month, count]) => ({
      month,
      count,
      hours: Math.min(monthlyCap, count * perActivity),
    }))
    .sort((a, b) => (a.month < b.month ? 1 : -1));

  const summed = months.reduce((s, m) => s + (Number.isFinite(m.hours) ? m.hours : 0), 0);
  const total = Math.min(annualCap, summed);
  return { months, total: Number.isFinite(total) ? total : 0 };
}

export const leaveProgress = (hours, leaveAt) => {
  const h = Number.isFinite(hours) ? hours : 0;
  return Math.min(100, Math.max(0, (h / Math.max(1, leaveAt)) * 100));
};
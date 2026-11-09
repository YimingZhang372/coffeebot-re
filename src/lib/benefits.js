/** Volunteer time earned from validated activities, capped per month and per year. */
export function volunteerHours(reuses, config) {
  const perMonth = {};
  reuses
    .filter((r) => r.status === "validated")
    .forEach((r) => {
      const key = String(r.occurredAt).slice(0, 7);
      perMonth[key] = (perMonth[key] || 0) + 1;
    });

  const months = Object.entries(perMonth)
    .map(([month, count]) => ({
      month,
      count,
      hours: Math.min(config.monthlyCap, count * config.hoursPerActivity),
    }))
    .sort((a, b) => (a.month < b.month ? 1 : -1));

  const total = Math.min(config.annualCap, months.reduce((s, m) => s + m.hours, 0));
  return { months, total };
}

export const leaveProgress = (hours, leaveAt) => Math.min(100, (hours / Math.max(1, leaveAt)) * 100);
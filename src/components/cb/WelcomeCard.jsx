import { useProgramme } from "@/lib/programmeData";
import { formatSgt } from "@/lib/programme";

const greeting = () => {
  const hour = new Date(Date.now() + 8 * 3600000).getUTCHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

/** Personal welcome for the signed-in employee, with a recency fallback when the week is quiet. */
export default function WelcomeCard({ onShare }) {
  const { me, myRow, reuses } = useProgramme();
  const floor = me?.floorCode || myRow?.code;
  const floorName = floor || "your floor";
  const firstName = (me?.name || "").split(" ")[0] || "there";
  const weekAgo = Date.now() - 7 * 86400000;

  const floorPosts = reuses
    .filter((r) => r.floorCode === floor && r.status === "validated")
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
  const thisWeek = floorPosts.filter((r) => new Date(r.occurredAt).getTime() > weekAgo);
  const last = floorPosts[0];

  const target = myRow?.target || 30;
  const needed = myRow ? Math.max(0, Math.ceil((target / 100) * myRow.eligible) - myRow.participants) : 0;

  return (
    <section className="flex flex-wrap items-end justify-between gap-5 bg-ink px-5 py-5 text-white sm:px-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">community · {floorName}</p>
        <p className="mt-2 text-[19px] leading-snug text-white">
          {greeting()}, {firstName}.{" "}
          {thisWeek.length ? (
            <>
              {floorName} shared {thisWeek.length} {thisWeek.length === 1 ? "reuse" : "reuses"} this week,{" "}
              {needed ? `${needed} ${needed === 1 ? "colleague" : "colleagues"} away from ${target}%` : `${target}% participation reached`}.
            </>
          ) : (
            <>
              No validated reuse on {floorName} this week.{" "}
              {last ? `Last activity was ${formatSgt(last.occurredAt, false)}.` : "You would be the first this month."}
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={onShare}
        className="rounded-full bg-white px-5 py-2.5 text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-caramel hover:text-white"
      >
        share a reuse
      </button>
    </section>
  );
}
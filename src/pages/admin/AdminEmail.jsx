import { useMemo, useState } from "react";
import { useProgramme } from "@/lib/programmeData";
import { monthLabel, timeAgo } from "@/lib/programme";
import { groundDropState } from "@/lib/groundDrop";
import { IMG } from "@/lib/assets";
import Pill from "@/components/cb/Pill";
import StatusChip from "@/components/cb/StatusChip";

export default function AdminEmail() {
  const { rows, reuses, settings, month, logEvent, me } = useProgramme();
  const [sent, setSent] = useState(false);
  const st = groundDropState(settings);
  const winner = rows[0];

  const bestPost = useMemo(() => {
    const validated = reuses.filter(
      (r) => r.status === "validated" && !r.showName && r.occurredAt.slice(0, 7) === month
    );
    return validated.sort((a, b) => {
      const s = (x) => Object.values(x.reactions || {}).reduce((t, n) => t + n, 0);
      return s(b) - s(a);
    })[0];
  }, [reuses, month]);

  const send = async () => {
    await logEvent({
      eventType: "email.sent",
      employeeLabel: "All Marina Bay staff",
      floorCode: "ALL",
      quantity: 0,
      status: "Sent",
      actor: me?.name,
      entityRef: "Monthly results email",
      detail: `Monthly results email for ${monthLabel(month)} sent through Harbourline internal email.`,
      auditable: true,
    });
    setSent(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold">Monthly email</h1>
          <p className="text-[12px] text-sub">
            Drafted from the leaderboard records. Sent through Harbourline&rsquo;s internal email, not from CoffeeBot.
          </p>
        </div>
        <StatusChip status={sent ? "validated" : "pending"}>{sent ? "sent" : "draft"}</StatusChip>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="border border-rule bg-paper">
          <div className="border-b border-rule px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-sub">preview</div>
          <div className="p-5">
            <img src={IMG.banner} alt="CoffeeBot Re monthly results banner" className="h-[150px] w-full object-cover" />
            <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-sub">
              from Group Sustainability, Harbourline Bank · {monthLabel(month)}
            </p>
            <h2 className="mt-2 text-[20px] font-semibold leading-snug">
              {winner?.code} takes {monthLabel(month)}: {((winner?.reused || 0) / 1000).toFixed(2)} kg of grounds reused
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-ink">
              Colleagues across Marina Bay took {((rows.reduce((s, r) => s + r.collected, 0)) / 1000).toFixed(2)} kg of
              spent grounds off the coffee machines this month and reported{" "}
              {((rows.reduce((s, r) => s + r.reused, 0)) / 1000).toFixed(2)} kg put back to use at home. That is{" "}
              {rows.reduce((s, r) => s + r.participants, 0)} colleagues across six floors.
            </p>

            <table className="mt-4 w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {["Rank", "Floor", "kg reused", "g / employee", "Participation"].map((h) => (
                    <th key={h} className="border-b border-rule py-1.5 text-left text-[10px] uppercase tracking-[0.12em] text-sub">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.code} className="border-b border-rule/60">
                    <td className="py-1.5 tabular">{r.rank}</td>
                    <td className="py-1.5">{r.code} · {r.name}</td>
                    <td className="py-1.5 tabular">{(r.reused / 1000).toFixed(2)}</td>
                    <td className="py-1.5 tabular">{Math.round(r.perEmployee)}</td>
                    <td className="py-1.5 tabular">{Math.round(r.participation)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 border-t border-rule pt-3 text-[13px] leading-relaxed">
              <p>
                <span className="font-medium">Floor of the month: </span>
                {winner?.code} · {winner?.name}. The prize this month is a team breakfast at Marina Bay funded by
                Harbourline, or a donation to a charity chosen by the floor.
              </p>
              {bestPost && (
                <p className="mt-2">
                  <span className="font-medium">Best anonymous post: </span>
                  {bestPost.floorCode} colleague, {bestPost.grams} g reused for{" "}
                  {bestPost.activityKey === "mushrooms" ? "an oyster mushroom kit" : bestPost.activityKey === "plant" ? "plant fertiliser" : bestPost.activityKey === "compost" ? "a compost booster" : "a fridge deodoriser"}{" "}
                  ({timeAgo(bestPost.occurredAt)}).
                </p>
              )}
              <p className="mt-2 text-sub">
                Next Ground Drop: {st.nextLabel} at {st.time}. Clear-out {st.clearOutLabel}.
              </p>
            </div>

            <p className="mt-4 border-t border-rule pt-3 text-[11px] text-sub">
              CoffeeBot Re v2.3 · Group Sustainability, Harbourline Bank · figures from weighed collections and
              Champion-validated reuse records.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-rule bg-paper p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-sub">recipients</p>
            <p className="mt-1 text-[13px] text-ink">All Marina Bay staff · 150 employees</p>
            <p className="mt-1 text-[12px] text-sub">
              Sent from the Sustainability team address through the bank&rsquo;s internal email on the last working day
              of the month at 09:00 SGT.
            </p>
          </div>

          <div className="border border-rule bg-paper p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-sub">checks</p>
            <ul className="mt-2 space-y-1.5 text-[12px]">
              <li className="flex justify-between"><span className="text-sub">results for every floor</span><span className="text-verdant">included</span></li>
              <li className="flex justify-between"><span className="text-sub">winning floor and prize</span><span className="text-verdant">included</span></li>
              <li className="flex justify-between"><span className="text-sub">best anonymous post</span><span className={bestPost ? "text-verdant" : "text-sub"}>{bestPost ? "included" : "none found"}</span></li>
              <li className="flex justify-between"><span className="text-sub">no individual names</span><span className="text-verdant">checked</span></li>
            </ul>
            <Pill className="mt-4 w-full" onClick={send} disabled={sent}>
              {sent ? "sent to all staff" : "send now"}
            </Pill>
            {sent && (
              <p className="mt-2 text-[11px] leading-relaxed text-verdant">
                Logged in the audit log and simulated as delivered through the bank&rsquo;s internal email.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import { useMemo, useState } from "react";
import { useProgramme } from "@/lib/programmeData";
import { monthLabel, activityByKey } from "@/lib/programme";
import { clockLabel, shortDate } from "@/lib/pledge";
import { IMG } from "@/lib/assets";
import Pill from "@/components/cb/Pill";
import StatusChip from "@/components/cb/StatusChip";

export default function AdminEmail() {
  const { reuses, settings, month, logEvent, me, board, config, rowsFor } = useProgramme();
  const [sent, setSent] = useState(false);

  const leader = board[0];
  const decided = Date.now() >= new Date(config.monthCloseAt).getTime();

  const bestPost = useMemo(() => {
    const validated = reuses.filter(
      (r) => r.status === "validated" && !r.showName && r.occurredAt.slice(0, 7) === month && r.grams > 0
    );
    return validated.sort((a, b) => b.grams - a.grams)[0];
  }, [reuses, month]);

  const past = useMemo(
    () =>
      ["2026-09", "2026-10"].map((key) => {
        const list = rowsFor(key);
        const top = list.slice().sort((a, b) => b.reused - a.reused)[0];
        return {
          key,
          label: monthLabel(key),
          launch: key === "2026-09",
          top,
          kgReused: list.reduce((s, r) => s + r.reused, 0) / 1000,
          kgCollected: list.reduce((s, r) => s + r.collected, 0) / 1000,
        };
      }),
    [rowsFor]
  );

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
            Drafted from the pledge board and the leaderboard records. Sent through Harbourline&rsquo;s internal email,
            not from CoffeeBot.
          </p>
        </div>
        <StatusChip status={sent ? "validated" : "pending"}>{sent ? "sent" : decided ? "draft" : "preview"}</StatusChip>
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
              {decided
                ? `${leader?.code} wins the ${monthLabel(month)} Pledge Auction on ${Math.round(leader?.score || 0)} points`
                : `${leader?.code} leads the ${monthLabel(month)} Pledge Auction on ${Math.round(leader?.score || 0)} projected points`}
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-ink">
              Six floors bid on their own uplift. Half the score is volume, half the uplift.
            </p>
            {!decided && (
              <p className="mt-2 text-[12px] leading-relaxed text-sub">
                Preview: the winner is announced after {shortDate(config.monthCloseAt)},{" "}
                {clockLabel(config.monthCloseAt)} SGT. Figures move until the month closes.
              </p>
            )}

            <table className="mt-4 w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {["Floor", "Bid", "Result g", "Volume pts", "Uplift pts", "Score"].map((h) => (
                    <th key={h} className="border-b border-rule py-1.5 text-left text-[10px] uppercase tracking-[0.12em] text-sub">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {board.map((r) => (
                  <tr key={r.code} className="border-b border-rule/60">
                    <td className="py-1.5">{r.code} · {r.name}</td>
                    <td className="py-1.5 tabular">
                      {r.finalBid != null ? `${r.bid}→${r.finalBid}%` : `${r.bid}%`}
                    </td>
                    <td className="py-1.5 tabular">{Math.round(r.projected)}</td>
                    <td className="py-1.5 tabular">{Math.round(r.volumePts)}</td>
                    <td className="py-1.5 tabular">{r.upliftPts.toFixed(1)}</td>
                    <td className="py-1.5 tabular">{Math.round(r.score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 border-t border-rule pt-3 text-[13px] leading-relaxed">
              <p>
                <span className="font-medium">Floor of the month: </span>
                {decided ? (
                  <>
                    {leader?.code} · {leader?.name}. The prize is a team breakfast at Marina Bay funded by Harbourline,
                    or a donation to a charity chosen by the floor.
                  </>
                ) : (
                  <>
                    announced after {shortDate(config.monthCloseAt)} at {clockLabel(config.monthCloseAt)}. The prize is a
                    team breakfast at Marina Bay funded by Harbourline, or a donation to a charity chosen by the floor.
                  </>
                )}
              </p>
              {bestPost && (
                <p className="mt-2">
                  <span className="font-medium">Best anonymous post: </span>
                  {bestPost.floorCode} colleague, {bestPost.grams} g reused,{" "}
                  {activityByKey(bestPost.activityKey).name.toLowerCase()}.
                </p>
              )}
              <p className="mt-2 text-sub">
                Next Pledge Night: {shortDate(config.nextPledgeNightAt)}, {clockLabel(config.nextPledgeNightAt)} for
                December. Final bid window opens {shortDate(config.finalBidOpenAt)}.
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
            <p className="text-[11px] uppercase tracking-[0.12em] text-sub">past months</p>
            <ul className="mt-2 divide-y divide-rule text-[12px]">
              {past.map((m) => (
                <li key={m.key} className="py-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-ink">{m.label}</span>
                    <span className="text-[11px] uppercase tracking-[0.1em] text-sub">
                      {m.launch ? "launch" : "auction"}
                    </span>
                  </div>
                  <p className="mt-1 text-sub">
                    Floor of the month{" "}
                    <span className="text-ink">
                      {m.launch ? "not contested" : `${m.top?.code} · ${m.top?.name}`}
                    </span>
                  </p>
                  <p className="mt-0.5 tabular text-sub">
                    {(m.kgReused).toFixed(2)} kg reused of {(m.kgCollected).toFixed(2)} kg collected
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] leading-relaxed text-sub">
              October&rsquo;s emails went out on the last working day; the results above are the issued figures.
            </p>
          </div>

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
              <li className="flex justify-between"><span className="text-sub">bid and result per floor</span><span className="text-verdant">included</span></li>
              <li className="flex justify-between"><span className="text-sub">volume and uplift points</span><span className="text-verdant">included</span></li>
              <li className="flex justify-between"><span className="text-sub">winner or projection, dated</span><span className="text-verdant">included</span></li>
              <li className="flex justify-between"><span className="text-sub">next pledge night</span><span className="text-verdant">included</span></li>
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
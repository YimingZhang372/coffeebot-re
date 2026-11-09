import { Link } from "react-router-dom";
import { useProgramme } from "@/lib/programmeData";
import { STEPS, bidPhase, clockLabel, monthTitle, shortDate } from "@/lib/pledge";
import PledgeHeader from "@/components/pledge/PledgeHeader";
import PledgeBoard from "@/components/pledge/PledgeBoard";
import ScoringPanel from "@/components/pledge/ScoringPanel";
import BidDialog from "@/components/pledge/BidDialog";
import PresentMode from "@/components/pledge/PresentMode";
import StatusChip from "@/components/cb/StatusChip";
import Pill from "@/components/cb/Pill";
import Barcode from "@/components/cb/Barcode";
import { useState } from "react";

export default function Pledge() {
  const { me, board, config, month, dropsDone, pledges, placeBid } = useProgramme();
  const [dialog, setDialog] = useState(null);
  const [present, setPresent] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [notice, setNotice] = useState("");

  const mine = board.find((r) => r.code === me?.floorCode);
  const phase = bidPhase(config);
  const isChampion = me?.role === "champion";
  const championCanAct = isChampion || me?.role === "admin";
  const pledgeRow = pledges.find((p) => p.month === month && p.floorCode === me?.floorCode);
  const currentBid = pledgeRow ? pledgeRow.finalBid ?? pledgeRow.openingBid : null;

  const bidWindow = phase.open
    ? `Final bid window open until ${shortDate(config.finalBidCloseAt)} ${clockLabel(config.finalBidCloseAt)}.`
    : phase.phase === "before"
    ? `Final bids open ${shortDate(config.finalBidOpenAt)} at ${clockLabel(config.finalBidOpenAt)}.`
    : "The final bid window has closed for this month.";

  const submitBid = async (pct, kind) => {
    await placeBid(pct, kind);
    setNotice(
      kind === "opening"
        ? `Opening bid of +${pct}% recorded for ${me?.floorCode}. Written to the audit log.`
        : `Final bid raised to +${pct}% for ${me?.floorCode}. Written to the audit log.`
    );
  };

  return (
    <div className="space-y-8">
      <PledgeHeader config={config} month={month} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-sub">
          {dropsDone} of 4 ground drops held · projections scale to the full month
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setScoring((v) => !v)}
            className="rounded-full border border-rule px-3 py-1.5 text-[12px] lowercase text-sub transition-colors hover:border-ink hover:text-ink"
          >
            how scoring works
          </button>
          <button
            type="button"
            onClick={() => setPresent(true)}
            className="rounded-full bg-ink px-4 py-1.5 text-[12px] lowercase text-white transition-colors hover:bg-caramel"
          >
            present mode
          </button>
        </div>
      </div>

      {scoring && <ScoringPanel board={board} config={config} example={mine} onClose={() => setScoring(false)} />}

      <div>
        <div className="border-b border-rule pb-3">
          <h2 className="text-[15px] lowercase"><span className="mr-2 text-sub tabular">00</span>the four steps</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-canvas px-4 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] tabular text-sub">{s.n}</span>
                <span className="text-[9px] uppercase tracking-[0.14em] text-sub">step</span>
              </div>
              <p className="mt-2 text-[14px] leading-none text-ink">{s.title}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-sub">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-rule pb-3">
          <h2 className="text-[15px] lowercase">
            <span className="mr-2 text-sub tabular">01</span>pledge board · {monthTitle(month)}
          </h2>
          <span className="text-[11px] uppercase tracking-[0.14em] text-sub">projected scores · g reused per employee</span>
        </div>
        <div className="mt-3">
          <PledgeBoard rows={board} myFloor={me?.floorCode} />
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-sub">
          Baseline is each floor&rsquo;s best of the last three months. Volume points are capped at {config.caps.volume};
          uplift at {config.caps.uplift}. Floor of the Month is decided {shortDate(config.monthCloseAt)} at 18:00.
        </p>
      </div>

      {(championCanAct || mine) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="bg-paper p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-sub">your floor · {mine?.code}</p>
                <h2 className="mt-1 text-[18px] text-ink">
                  {mine ? `${mine.bid}% bid · ${mine.paceMet ? "on track" : "behind"}` : "No floor assigned"}
                </h2>
              </div>
              <StatusChip status={mine?.paceMet ? "validated" : "pending"}>{mine?.paceMet ? "on track" : "behind"}</StatusChip>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px]">
              {[
                ["Baseline", `${mine?.baselinePer} g per employee`],
                ["To date", `${Math.round(mine?.toDate || 0)} g per employee`],
                ["Projected", `${Math.round(mine?.projected || 0)} g per employee`],
                ["Projected score", `${Math.round(mine?.score || 0)} of 100`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-rule/60 pb-1">
                  <dt className="text-sub">{k}</dt>
                  <dd className="tabular text-ink">{v}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-3 text-[12px] leading-relaxed text-sub">{bidWindow}</p>

            {championCanAct ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Pill
                  size="sm"
                  onClick={() => setDialog("opening")}
                >
                  {currentBid == null ? "place bid" : "adjust opening bid"}
                </Pill>
                <Pill
                  size="sm"
                  variant="outline"
                  disabled={!phase.open}
                  onClick={() => setDialog("final")}
                >
                  raise bid
                </Pill>
                <span className="text-[10px] uppercase tracking-[0.1em] text-sub">
                  {phase.open ? "one raise only" : "opens " + shortDate(config.finalBidOpenAt)}
                </span>
              </div>
            ) : (
              <p className="mt-4 text-[12px] text-sub">Your Floor Champion places and raises the bid for {mine?.code}.</p>
            )}

            {notice && <p className="mt-3 text-[12px] text-verdant">{notice}</p>}
          </div>

          <div className="border border-rule bg-paper p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-sub">audit trail</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-sub">
              Every bid is written to the programme audit log with the floor, the percentage and the champion who placed it.
            </p>
            <ul className="mt-3 space-y-2">
              {(pledgeRow?.bids || []).slice().reverse().map((b, i) => (
                <li key={i} className="flex items-center gap-3 border-b border-rule/60 pb-2 text-[12px]">
                  <Barcode value={`${me?.floorCode}-${b.pct}-${i}`} height={18} showValue={false} className="w-[46px] shrink-0" />
                  <span className="text-ink">+{b.pct}% · {b.kind}</span>
                  <span className="ml-auto text-sub">{b.by}</span>
                </li>
              ))}
              {!pledgeRow?.bids?.length && <li className="text-[12px] text-sub">No bid recorded for your floor yet.</li>}
            </ul>
            {me?.role === "admin" && (
              <Link to="/admin/pledges" className="mt-3 inline-block text-[12px] underline decoration-rule underline-offset-4 hover:text-caramel">
                open the pledge console
              </Link>
            )}
          </div>
        </div>
      )}

      <BidDialog
        open={!!dialog}
        mode={dialog || "opening"}
        floorCode={me?.floorCode}
        current={dialog === "final" ? currentBid : null}
        windowLabel={dialog === "final" ? "" : bidWindow}
        onClose={() => setDialog(null)}
        onSubmit={submitBid}
      />

      {present && (
        <PresentMode
          rows={board}
          myFloor={me?.floorCode}
          config={config}
          month={month}
          onClose={() => setPresent(false)}
        />
      )}
    </div>
  );
}
import Pill from "@/components/cb/Pill";
import { pts } from "@/lib/pledge";

/** The scoring formula, with a worked example taken from the live records. */
export default function ScoringPanel({ board, config, example, onClose }) {
  const { caps, multipliers, perEmployeeCapG } = config;
  const ex = example || board[0];

  return (
    <div className="border border-rule bg-paper p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-sub">how scoring works</p>
          <h2 className="mt-1 text-[18px] text-ink">Half volume, half uplift</h2>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-[12px] text-sub hover:text-ink">close ✕</button>
        )}
      </div>

      <ol className="mt-4 space-y-2 text-[12.5px] leading-relaxed text-ink">
        <li>
          <span className="text-sub">Baseline · </span>the floor&rsquo;s best month of the last three, in g reused per employee.
          November&rsquo;s baseline is October.
        </li>
        <li>
          <span className="text-sub">Volume points · </span>
          g reused per employee ÷ {perEmployeeCapG} g × 100, capped at {caps.volume}.
        </li>
        <li>
          <span className="text-sub">Uplift % · </span>(this month − baseline) ÷ baseline.
        </li>
        <li>
          <span className="text-sub">Uplift points · </span>
          uplift × {multipliers.met} if the opening bid is met, × {multipliers.missed} if missed. Raised at the final bid:
          × {multipliers.finalMet} if met, × {multipliers.finalMissed} if missed. Never below 0, capped at {caps.uplift}.
        </li>
        <li>
          <span className="text-sub">Score · </span>volume + uplift, out of {caps.volume + caps.uplift}. Tie-break: weeks on
          or above pledge pace.
        </li>
        <li>
          <span className="text-sub">Projected · </span>g to date × (4 ÷ Ground Drops held). Labelled projected until the
          month closes.
        </li>
      </ol>

      {ex && (
        <div className="mt-4 border-t border-rule pt-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-sub">worked example · {ex.code}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink">
            To date {Math.round(ex.toDate)} g per employee, projected {Math.round(ex.projected)} g. Baseline{" "}
            {ex.baselinePer} g, bid {ex.finalBid != null ? `${ex.bid}% raised to ${ex.finalBid}%` : `${ex.bid}%`}.
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-sub">
            Volume {Math.round(ex.volumePts)} ({Math.round(ex.projected)} ÷ {perEmployeeCapG} × 100) + uplift{" "}
            {pts(ex.upliftPts)} ({pts(ex.upliftPct)}% uplift, {ex.met ? "bid met" : "bid missed"}) ={" "}
            <span className="text-ink">{Math.round(ex.score)}</span>.
          </p>
        </div>
      )}
    </div>
  );
}
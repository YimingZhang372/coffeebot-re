import { useState } from "react";
import { activityByKey, formatSgt } from "@/lib/programme";
import StatusChip from "@/components/cb/StatusChip";

const THUMB = "h-14 w-14 shrink-0 overflow-hidden rounded-[2px] bg-[#D6D2CD] object-cover";

/** One queue row: photo, floor, grams, proof, and the two decisions. */
export default function ValidationRow({ row, collected, onValidate, onReject, busy }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <li className="border-b border-rule py-3">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex gap-2">
          {row.photo ? (
            <img src={row.photo} alt={`${row.floor} record`} className={THUMB} />
          ) : (
            <span className={`${THUMB} flex items-center justify-center text-[9px] uppercase tracking-[0.1em] text-sub`}>
              no photo
            </span>
          )}
          {row.proof && row.proof !== row.photo && (
            <img src={row.proof} alt="Proof of weighing" className={THUMB} />
          )}
        </div>

        <div className="min-w-[180px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.12em] text-sub">
              {row.kind === "collection" ? "collection" : "reuse post"}
            </span>
            <StatusChip status="pending">
              {row.kind === "collection" ? "reported" : "pending validation"}
            </StatusChip>
          </div>
          <p className="mt-1 text-[13px] text-ink">
            {row.refId} · {row.floor} · {row.employeeLabel}
          </p>
          <p className="mt-0.5 truncate text-[11.5px] text-sub">
            {row.kind === "collection"
              ? `weighed at the ${row.floor} table · ${formatSgt(row.at, false)}`
              : `${activityByKey(row.activityKey).name} · ${formatSgt(row.at, false)} · ${row.note || "no note"}`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11.5px] sm:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.1em] text-sub">
              {row.kind === "collection" ? "collected" : "reused"}
            </p>
            <p className="tabular text-ink">{row.grams} g</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.1em] text-sub">floor collected</p>
            <p className="tabular text-ink">{(collected / 1000).toFixed(2)} kg</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.1em] text-sub">proof</p>
            <p className="text-ink">{row.proof ? "attached" : "none"}</p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onValidate(row)}
            className="rounded-full bg-ink px-3 py-1.5 text-[12px] lowercase text-white transition-colors hover:bg-verdant disabled:opacity-40"
          >
            validate
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRejecting((v) => !v)}
            className="rounded-full border border-rule px-3 py-1.5 text-[12px] lowercase text-sub transition-colors hover:border-[#A44A3F] hover:text-[#A44A3F] disabled:opacity-40"
          >
            reject
          </button>
        </div>
      </div>

      {rejecting && (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-l-2 border-[#A44A3F] pl-3">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (required, sent to the author and written to the audit log)"
            className="h-9 min-w-[240px] flex-1 border border-rule bg-white px-2 text-[12px] outline-none focus:border-ink"
          />
          <button
            type="button"
            disabled={busy || reason.trim().length < 5}
            onClick={() => onReject(row, reason.trim())}
            className="rounded-full bg-[#A44A3F] px-3 py-1.5 text-[12px] lowercase text-white disabled:opacity-40"
          >
            confirm rejection
          </button>
        </div>
      )}
    </li>
  );
}
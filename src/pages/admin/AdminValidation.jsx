import { useMemo, useState } from "react";
import { useProgramme } from "@/lib/programmeData";
import { FLOORS } from "@/lib/programme";
import { monthOf } from "@/lib/metrics";
import ValidationRow from "@/components/admin/ValidationRow";
import EmptyState from "@/components/cb/EmptyState";

export default function AdminValidation() {
  const { reuses, collections, rows, month, reviewReuse, reviewCollection, maskLabel } = useProgramme();
  const [floor, setFloor] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const collectedByFloor = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      map[r.code] = r.collected;
    });
    return map;
  }, [rows]);

  const queue = useMemo(() => {
    const posts = reuses
      .filter((r) => r.status === "pending")
      .map((r) => ({
        kind: "reuse",
        id: r.id,
        refId: r.refId,
        floor: r.floorCode,
        grams: r.grams,
        photo: r.photoUrl,
        proof: r.photoUrl,
        at: r.occurredAt,
        note: r.note,
        activityKey: r.activityKey,
        employeeLabel: maskLabel(r.employeeEmail, r.showName, r.floorCode),
        record: r,
      }));
    const cols = collections
      .filter((c) => c.needsReview || c.evidenceLevel === "Reported")
      .map((c) => ({
        kind: "collection",
        id: c.id,
        refId: c.refId,
        floor: c.floorCode,
        grams: c.grams,
        photo: c.proofPhotoUrl,
        proof: c.proofPhotoUrl,
        at: c.occurredAt,
        note: "collection logged without a proof photo",
        employeeLabel: maskLabel(c.employeeEmail, false, c.floorCode),
        record: c,
      }));
    return [...posts, ...cols]
      .filter((r) => (floor ? r.floor === floor : true))
      .sort((a, b) => (a.at < b.at ? 1 : -1));
  }, [reuses, collections, floor, maskLabel]);

  const counts = useMemo(() => {
    const validated =
      reuses.filter((r) => r.status === "validated" && monthOf(r.occurredAt) === month).length +
      collections.filter((c) => c.evidenceLevel === "Weighed" && monthOf(c.occurredAt) === month).length;
    const rejected =
      reuses.filter((r) => r.status === "rejected" && monthOf(r.occurredAt) === month).length +
      collections.filter((c) => c.tableStatus === "rejected" && monthOf(c.occurredAt) === month).length;
    return { pending: queue.length, validated, rejected };
  }, [reuses, collections, queue.length, month]);

  const decide = async (row, decision, reason = "") => {
    setBusy(true);
    try {
      if (row.kind === "collection") await reviewCollection(row.record, decision, reason);
      else await reviewReuse(row.record, decision, reason);
      setNotice(
        `${row.refId} ${decision === "validated" ? "validated" : "rejected"}. Scores and the audit log are updated.`
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold">Validation</h1>
          <p className="text-[12px] text-sub">
            Every post and every collection waiting on a decision, across all six floors. Validation feeds the floor
            scores; every decision is written to the audit log.
          </p>
        </div>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.12em] text-sub">floor</span>
          <select
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            className="mt-1 block h-8 border border-rule bg-white px-2 text-[12px]"
          >
            <option value="">all floors</option>
            {FLOORS.map((f) => (
              <option key={f.code} value={f.code}>
                {f.code}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-3 gap-px border-y border-rule bg-rule">
        {[
          ["pending validation", counts.pending],
          ["validated this month", counts.validated],
          ["rejected this month", counts.rejected],
        ].map(([label, value]) => (
          <div key={label} className="bg-canvas px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-sub">{label}</p>
            <p className="mt-1 text-[20px] tabular text-ink">{value}</p>
          </div>
        ))}
      </div>

      {notice && <div className="border border-verdant/40 bg-verdant/10 px-4 py-2 text-[12px] text-verdant">{notice}</div>}

      <div className="border border-rule bg-paper px-4 py-2">
        {queue.length ? (
          <ul>
            {queue.map((row) => (
              <ValidationRow
                key={`${row.kind}-${row.id}`}
                row={row}
                collected={collectedByFloor[row.floor] || 0}
                busy={busy}
                onValidate={(r) => decide(r, "validated")}
                onReject={(r, reason) => decide(r, "rejected", reason)}
              />
            ))}
          </ul>
        ) : (
          <div className="py-6">
            <EmptyState
              title="Queue clear."
              body="Every post and every collection has been validated or rejected. New submissions appear here immediately."
            />
          </div>
        )}
      </div>
    </div>
  );
}
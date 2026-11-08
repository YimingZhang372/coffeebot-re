import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useProgramme } from "@/lib/programmeData";
import { FLOORS, formatSgt, monthOf } from "@/lib/programme";
import { monthOf as mk } from "@/lib/metrics";
import AdminTable from "@/components/admin/AdminTable";
import StatusChip from "@/components/cb/StatusChip";
import PrivatePhoto from "@/components/cb/PrivatePhoto";
import Skeleton from "@/components/cb/Skeleton";
import { ACTIVITIES } from "@/lib/programme";

const TYPE_OPTIONS = [
  "collection", "reuse.submitted", "post.validated", "post.rejected", "comment",
  "certificate.issued", "certificate.revoked", "settings.changed", "employee.joined",
  "challenge.created", "decision.override", "nudge.sent",
];

export default function AdminActivity() {
  const { reuses, collections, me, reviewReuse, logEvent, maskLabel } = useProgramme();
  const [events, setEvents] = useState(null);
  const [tab, setTab] = useState("all");
  const [floor, setFloor] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("2026-09-01");
  const [to, setTo] = useState("2026-11-08");
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await base44.entities.ActivityEvent.list({ sort: "-occurredAt", limit: 500 });
      setEvents(Array.isArray(res) ? res : res?.items || []);
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = events || [];
    list = list.filter((e) => e.occurredAt.slice(0, 10) >= from && e.occurredAt.slice(0, 10) <= to);
    if (floor) list = list.filter((e) => e.floorCode === floor);
    if (type) list = list.filter((e) => e.eventType === type);
    if (search.trim()) list = list.filter((e) => e.refId?.toLowerCase().includes(search.trim().toLowerCase()));
    return list;
  }, [events, floor, type, from, to, search]);

  const anomalies = useMemo(() => {
    const out = [];
    const byEmpMonth = {};
    collections.forEach((c) => {
      const key = `${c.employeeEmail}|${monthOf(c.occurredAt)}`;
      byEmpMonth[key] = (byEmpMonth[key] || 0) + c.grams;
    });
    const reuseByEmpMonth = {};
    reuses.filter((r) => r.status === "validated").forEach((r) => {
      const key = `${r.employeeEmail}|${monthOf(r.occurredAt)}`;
      reuseByEmpMonth[key] = (reuseByEmpMonth[key] || 0) + r.grams;
    });
    Object.entries(reuseByEmpMonth).forEach(([key, grams]) => {
      const collected = byEmpMonth[key] || 0;
      if (grams > collected + 20) {
        const [email, month] = key.split("|");
        out.push({
          id: `over-${key}`,
          kind: "Grams reused exceed grams collected",
          label: maskLabel(email, false, "—"),
          floorCode: email.split(".")[0],
          month,
          grams,
          detail: `${grams} g reported against ${collected} g weighed in ${month}.`,
          email,
        });
      }
    });
    const dayTotals = {};
    collections.forEach((c) => {
      const key = `${c.employeeEmail}|${c.occurredAt.slice(0, 10)}`;
      dayTotals[key] = (dayTotals[key] || 0) + c.grams;
    });
    Object.entries(dayTotals).forEach(([key, grams]) => {
      if (grams > 1000) {
        const [email, day] = key.split("|");
        out.push({
          id: `day-${key}`,
          kind: "More than 1 kg in one day by one person",
          label: maskLabel(email, false, "—"),
          floorCode: "",
          month: day,
          grams,
          detail: `${grams} g weighed on ${day}.`,
          email,
        });
      }
    });
    reuses.forEach((r) => {
      if (!r.photoUrl) {
        out.push({
          id: `nophoto-${r.id}`,
          kind: "Post without a photo",
          label: maskLabel(r.employeeEmail, r.showName, r.floorCode),
          floorCode: r.floorCode,
          month: r.occurredAt.slice(0, 7),
          grams: r.grams,
          detail: `${r.refId} has no photo attached.`,
          reuse: r,
        });
      }
      if (r.status === "pending" && Date.now() - new Date(r.occurredAt).getTime() > 5 * 86400000) {
        out.push({
          id: `stale-${r.id}`,
          kind: "Pending validation for more than 5 days",
          label: maskLabel(r.employeeEmail, r.showName, r.floorCode),
          floorCode: r.floorCode,
          month: r.occurredAt.slice(0, 7),
          grams: r.grams,
          detail: `${r.refId} submitted ${formatSgt(r.occurredAt)}.`,
          reuse: r,
        });
      }
    });
    return out;
  }, [collections, reuses, maskLabel]);

  const linkedReuse = drawer ? reuses.find((r) => r.refId === drawer.entityRef) : null;

  const override = async (decision) => {
    if (!linkedReuse) return;
    if (decision === "rejected" && reason.trim().length < 5) return;
    setBusy(true);
    await reviewReuse(linkedReuse, decision, decision === "rejected" ? reason.trim() : "");
    await logEvent({
      eventType: "decision.override",
      employeeLabel: maskLabel(linkedReuse.employeeEmail, linkedReuse.showName, linkedReuse.floorCode),
      employeeEmail: linkedReuse.employeeEmail,
      floorCode: linkedReuse.floorCode,
      quantity: linkedReuse.grams,
      quantityUnit: "g reused",
      status: decision === "validated" ? "Validated (override)" : "Rejected (override)",
      actor: me?.name,
      entityRef: linkedReuse.refId,
      detail: `Administrator overrode the Champion decision: ${decision}${reason ? ` — ${reason.trim()}` : ""}`,
      photoUrl: linkedReuse.photoUrl || "",
      auditable: true,
    });
    setBusy(false);
    setDrawer(null);
    setReason("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold">Activity</h1>
          <p className="text-[12px] text-sub">
            Every event in the programme: collections, reuse records, validations, comments, certificates and settings.
          </p>
        </div>
        <div className="flex gap-2">
          {[["all", "All events"], ["review", `Needs review (${anomalies.length})`]].map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                tab === k ? "border-ink bg-ink text-white" : "border-rule text-sub hover:border-ink hover:text-ink"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2 border border-rule bg-paper p-3">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.12em] text-sub">from</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-8 border border-rule bg-white px-2 text-[12px]" />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.12em] text-sub">to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 h-8 border border-rule bg-white px-2 text-[12px]" />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.12em] text-sub">floor</span>
          <select value={floor} onChange={(e) => setFloor(e.target.value)} className="mt-1 h-8 border border-rule bg-white px-2 text-[12px]">
            <option value="">all floors</option>
            {FLOORS.map((f) => <option key={f.code} value={f.code}>{f.code}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.12em] text-sub">event type</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 h-8 border border-rule bg-white px-2 text-[12px]">
            <option value="">all types</option>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block flex-1 min-w-[160px]">
          <span className="text-[10px] uppercase tracking-[0.12em] text-sub">search by ID</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="EV-2026-00123"
            className="mt-1 h-8 w-full border border-rule bg-white px-2 text-[12px]"
          />
        </label>
      </div>

      {tab === "all" && (
        <div className="border border-rule bg-paper p-4">
          {!events ? (
            <Skeleton rows={8} />
          ) : (
            <AdminTable
              exportName="coffeebot-activity.csv"
              rows={filtered}
              pageSize={15}
              initialSort={{ key: "occurredAt", dir: "desc" }}
              onRowClick={setDrawer}
              columns={[
                { key: "refId", label: "Event ID", width: 110 },
                { key: "occurredAt", label: "Timestamp (SGT)", render: (r) => formatSgt(r.occurredAt) },
                { key: "eventType", label: "Type", render: (r) => <span className="text-sub">{r.eventType}</span> },
                { key: "employeeLabel", label: "Employee" },
                { key: "floorCode", label: "Floor", width: 60 },
                { key: "quantity", label: "Quantity", align: "right", render: (r) => (r.quantity ? `${r.quantity} ${r.quantityUnit || ""}` : "—") },
                {
                  key: "status",
                  label: "Status",
                  render: (r) => (
                    <StatusChip status={r.status?.toLowerCase().includes("reject") ? "rejected" : r.status?.toLowerCase().includes("valid") ? "validated" : "neutral"}>
                      {r.status}
                    </StatusChip>
                  ),
                },
                { key: "actor", label: "Actor" },
              ]}
            />
          )}
        </div>
      )}

      {tab === "review" && (
        <div className="border border-rule bg-paper p-4">
          {anomalies.length ? (
            <AdminTable
              exportName="coffeebot-needs-review.csv"
              rows={anomalies}
              pageSize={12}
              onRowClick={(r) => r.reuse && setDrawer({ entityRef: r.reuse.refId, occurredAt: r.reuse.occurredAt, refId: "review", photoUrl: r.reuse.photoUrl, detail: r.detail })}
              columns={[
                { key: "kind", label: "Flag" },
                { key: "label", label: "Employee" },
                { key: "floorCode", label: "Floor", width: 60 },
                { key: "month", label: "Period", width: 100 },
                { key: "grams", label: "Grams", align: "right" },
                { key: "detail", label: "Detail" },
              ]}
            />
          ) : (
            <p className="py-6 text-center text-[12px] text-sub">No anomalies flagged. The queue clears itself as records are validated.</p>
          )}
        </div>
      )}

      {drawer && (
        <div className="fixed inset-0 z-40 bg-ink/30" onClick={() => setDrawer(null)}>
          <aside
            className="absolute right-0 top-0 h-full w-[min(94vw,440px)] overflow-y-auto border-l border-rule bg-paper p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-sub">record detail</p>
                <p className="mt-1 text-[15px] text-ink">{drawer.entityRef}</p>
              </div>
              <button type="button" onClick={() => setDrawer(null)} className="text-[12px] text-sub hover:text-ink">close ✕</button>
            </div>

            <dl className="mt-4 space-y-2 border-y border-rule py-3 text-[12px]">
              <div className="flex justify-between"><dt className="text-sub">Event</dt><dd className="text-ink">{drawer.refId}</dd></div>
              <div className="flex justify-between"><dt className="text-sub">Timestamp</dt><dd className="text-ink">{formatSgt(drawer.occurredAt)}</dd></div>
              <div className="flex justify-between"><dt className="text-sub">Floor</dt><dd className="text-ink">{drawer.floorCode || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-sub">Detail</dt><dd className="max-w-[60%] text-right text-ink">{drawer.detail}</dd></div>
            </dl>

            {linkedReuse && (
              <>
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-sub">proof</p>
                  {linkedReuse.photoUrl ? (
                    <img src={linkedReuse.photoUrl} alt="Reuse record" className="mt-2 h-40 w-full object-cover" />
                  ) : (
                    <p className="mt-2 border border-dashed border-rule px-3 py-6 text-center text-[12px] text-sub">no photo attached</p>
                  )}
                </div>
                <dl className="mt-3 space-y-2 text-[12px]">
                  <div className="flex justify-between"><dt className="text-sub">Activity</dt><dd className="text-ink">{ACTIVITIES.find((a) => a.key === linkedReuse.activityKey)?.name}</dd></div>
                  <div className="flex justify-between"><dt className="text-sub">Grams reused</dt><dd className="tabular text-ink">{linkedReuse.grams} g</dd></div>
                  <div className="flex justify-between"><dt className="text-sub">Status</dt><dd className="text-ink">{linkedReuse.status}</dd></div>
                  <div className="flex justify-between"><dt className="text-sub">Validated by</dt><dd className="text-ink">{linkedReuse.validatedBy || "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-sub">Note</dt><dd className="max-w-[60%] text-right text-ink">{linkedReuse.note}</dd></div>
                </dl>
                <div className="mt-4 border-t border-rule pt-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-sub">override the Champion decision</p>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason (required for rejection, written to the audit log)"
                    className="mt-2 h-9 w-full border border-rule bg-white px-2 text-[12px]"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => override("validated")}
                      className="rounded-full bg-ink px-3 py-1.5 text-[12px] text-white hover:bg-verdant"
                    >
                      validate
                    </button>
                    <button
                      type="button"
                      disabled={busy || reason.trim().length < 5}
                      onClick={() => override("rejected")}
                      className="rounded-full border border-rule px-3 py-1.5 text-[12px] text-sub hover:border-[#A44A3F] hover:text-[#A44A3F]"
                    >
                      reject
                    </button>
                  </div>
                </div>
              </>
            )}

            {!linkedReuse && drawer.photoUrl && (
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-sub">photo</p>
                <PrivatePhoto uri={drawer.photoUrl} className="mt-2 h-40 w-full object-cover" />
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
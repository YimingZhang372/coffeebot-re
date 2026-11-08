import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatSgt } from "@/lib/programme";
import AdminTable from "@/components/admin/AdminTable";
import Skeleton from "@/components/cb/Skeleton";

const TYPES = [
  "collection", "reuse.submitted", "post.validated", "post.rejected",
  "certificate.issued", "certificate.revoked", "settings.changed", "employee.joined",
  "decision.override", "challenge.created", "nudge.sent",
];

export default function AdminAudit() {
  const [events, setEvents] = useState(null);
  const [type, setType] = useState("");

  useEffect(() => {
    (async () => {
      const res = await base44.entities.ActivityEvent.list({ sort: "-occurredAt", limit: 500 });
      const list = Array.isArray(res) ? res : res?.items || [];
      setEvents(list.filter((e) => e.auditable));
    })();
  }, []);

  const filtered = useMemo(
    () => (events || []).filter((e) => (type ? e.eventType === type : true)),
    [events, type]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold">Audit log</h1>
        <p className="text-[12px] text-sub">
          Who changed what, and when. Certificate issues and revocations, settings changes and decision overrides are
          recorded here and cannot be edited.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 border border-rule bg-white px-2 text-[12px]">
          <option value="">all audit events</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="text-[11px] uppercase tracking-[0.12em] text-sub">retained for the programme term</span>
      </div>

      <div className="border border-rule bg-paper p-4">
        {!events ? (
          <Skeleton rows={6} />
        ) : (
          <AdminTable
            exportName="coffeebot-audit-log.csv"
            rows={filtered}
            pageSize={15}
            initialSort={{ key: "occurredAt", dir: "desc" }}
            columns={[
              { key: "refId", label: "Event ID", width: 110 },
              { key: "occurredAt", label: "Timestamp (SGT)", render: (r) => formatSgt(r.occurredAt) },
              { key: "eventType", label: "Type", render: (r) => <span className="text-sub">{r.eventType}</span> },
              { key: "actor", label: "Actor" },
              { key: "floorCode", label: "Floor", width: 60 },
              { key: "entityRef", label: "Object", width: 150 },
              { key: "detail", label: "Detail" },
            ]}
          />
        )}
      </div>
    </div>
  );
}
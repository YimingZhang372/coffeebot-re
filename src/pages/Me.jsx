import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProgramme } from "@/lib/programmeData";
import { formatSgt, activityByKey, monthLabel } from "@/lib/programme";
import { downloadCertificate } from "@/lib/certPdf";
import Barcode from "@/components/cb/Barcode";
import StatusChip from "@/components/cb/StatusChip";
import Pill from "@/components/cb/Pill";
import CountUp from "@/components/cb/CountUp";
import EmptyState from "@/components/cb/EmptyState";

const QUARTER = "2026-Q4";

export default function Me() {
  const { me, myCollections, myReuses, certificates, month } = useProgramme();
  const [filter, setFilter] = useState("all");

  const collected = myCollections.reduce((s, c) => s + c.grams, 0);
  const validated = myReuses.filter((r) => r.status === "validated");
  const reused = validated.reduce((s, r) => s + r.grams, 0);
  const hours = validated.length * 0.5;

  const quarterReuses = myReuses.filter((r) => r.occurredAt >= "2026-10-01" && r.occurredAt <= "2026-12-31");
  const quarterValidated = quarterReuses.filter((r) => r.status === "validated");
  const quarterCollected = myCollections.filter((c) => c.occurredAt >= "2026-10-01");

  const employeeCert = {
    certId: `CB-EMP-${QUARTER}-${(me?.refId || "EMP").slice(-3)}`,
    type: "employee",
    period: QUARTER,
    periodLabel: "Q4 2026 (October to December)",
    office: me?.office || "Marina Bay",
    floorCode: me?.floorCode,
    kgCollected: Number((quarterCollected.reduce((s, c) => s + c.grams, 0) / 1000).toFixed(2)),
    kgReused: Number((quarterValidated.reduce((s, r) => s + r.grams, 0) / 1000).toFixed(2)),
    reuseRate: 0,
    activitiesDone: quarterValidated.length,
    volunteeringHours: quarterValidated.length * 0.5,
    nextTarget: "1 reuse record per month",
    issuedAt: new Date().toISOString(),
  };
  employeeCert.reuseRate = employeeCert.kgCollected
    ? Number(((employeeCert.kgReused / employeeCert.kgCollected) * 100).toFixed(1))
    : 0;

  const history = useMemo(() => {
    const cols = myCollections.map((c) => ({
      id: c.id, refId: c.refId, kind: "collection", when: c.occurredAt, grams: c.grams,
      label: `${c.grams} g collected`, status: c.evidenceLevel, meta: `${c.floorCode} table`,
    }));
    const reus = myReuses.map((r) => ({
      id: r.id, refId: r.refId, kind: "reuse", when: r.occurredAt, grams: r.grams,
      label: `${r.grams} g reused · ${activityByKey(r.activityKey).name}`, status: r.status,
      meta: r.note,
    }));
    const merged = [...cols, ...reus].sort((a, b) => (a.when < b.when ? 1 : -1));
    return filter === "all" ? merged : merged.filter((m) => m.kind === filter);
  }, [myCollections, myReuses, filter]);

  return (
    <div className="space-y-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-sub">
            me · {me?.floorCode} {me?.department}
          </p>
          <h1 className="display mt-3 text-[46px] sm:text-[76px]">{me?.name}</h1>
          <p className="mt-2 text-[13px] text-sub">
            {me?.role === "champion" ? "Floor Champion" : me?.role === "admin" ? "Sustainability Admin" : "Employee"} ·{" "}
            {me?.email} · joined {formatSgt(me?.joinedAt, false)}
          </p>
        </div>
        <div className="text-right text-[11px] uppercase leading-relaxed tracking-[0.14em] text-sub">
          {myCollections.length} collections · {myReuses.length} reuse records
          <br />
          {monthLabel(month)} to date
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-rule border-y border-rule lg:grid-cols-4">
        {[
          { label: "kg collected", value: collected / 1000, unit: "weighed" },
          { label: "kg reused", value: reused / 1000, unit: "validated" },
          { label: "activities done", value: validated.length, unit: "all time", decimals: 0 },
          { label: "volunteering hours", value: hours, unit: "1 activity = 0.5 h", decimals: 1 },
        ].map((k) => (
          <div key={k.label} className="bg-canvas px-4 py-6">
            <p className="text-[11px] uppercase tracking-[0.14em] text-sub">{k.label}</p>
            <p className="display mt-2 text-[38px]">
              <CountUp value={k.value} decimals={k.decimals ?? 2} />
            </p>
            <p className="text-[11px] uppercase tracking-[0.12em] text-sub">{k.unit}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-3">
            <h2 className="text-[15px] lowercase">
              <span className="mr-2 text-sub tabular">01</span>history
            </h2>
            <div className="flex gap-2">
              {[["all", "all"], ["collection", "collections"], ["reuse", "reuse"]].map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilter(k)}
                  className={`rounded-full border px-3 py-1 text-[11px] lowercase ${
                    filter === k ? "border-ink bg-ink text-white" : "border-rule text-sub hover:text-ink"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2">
            {history.length ? (
              history.map((h) => (
                <div key={`${h.kind}-${h.id}`} className="flex items-center gap-4 border-b border-rule py-3">
                  <Barcode value={h.refId} height={22} showValue={false} className="w-[70px] shrink-0 hidden sm:block" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-ink">{h.label}</p>
                    <p className="truncate text-[11px] text-sub">
                      {h.refId} · {formatSgt(h.when)} · {h.meta}
                    </p>
                  </div>
                  <StatusChip
                    status={h.kind === "collection" ? (h.status === "Weighed" ? "validated" : "pending") : h.status}
                  >
                    {h.kind === "collection" ? h.status : h.status === "pending" ? "pending" : h.status}
                  </StatusChip>
                </div>
              ))
            ) : (
              <EmptyState
                title="Nothing recorded yet."
                body="Collections you log at the floor table and reuses you report will appear here, each with its record ID."
                action={<Pill size="sm" to="/collect">I took grounds</Pill>}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-paper p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-sub">my certificate</p>
            <p className="mt-1 text-[15px] text-ink">Quarterly · {QUARTER}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-sub">
              Personal certificate recording your weighed collections, validated reuses and volunteering hours.
              Floor and ESG certificates are issued by the Sustainability team.
            </p>
            <div className="mt-3 space-y-1 border-y border-rule py-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-sub">collected</span>
                <span className="tabular text-ink">{employeeCert.kgCollected.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sub">reused</span>
                <span className="tabular text-ink">{employeeCert.kgReused.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sub">volunteering hours</span>
                <span className="tabular text-ink">{employeeCert.volunteeringHours.toFixed(1)} h</span>
              </div>
            </div>
            <Pill className="mt-3 w-full" size="sm" onClick={() => downloadCertificate(employeeCert, { employeeName: me?.name })}>
              download my certificate (pdf)
            </Pill>
            <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-sub">
              {employeeCert.certId} · no CO2e on employee certificates
            </p>
          </div>

          <div>
            <p className="border-b border-rule pb-2 text-[11px] uppercase tracking-[0.14em] text-sub">issued to me</p>
            <ul className="mt-2 space-y-2 text-[12px]">
              {certificates
                .filter((c) => c.type === "employee" && c.employeeEmail === me?.email)
                .map((c) => (
                  <li key={c.id} className="border-b border-rule pb-2">
                    <p className="text-ink">{c.certId}</p>
                    <p className="text-sub">{c.periodLabel} · {c.status}</p>
                  </li>
                ))}
              {!certificates.some((c) => c.type === "employee" && c.employeeEmail === me?.email) && (
                <li className="text-sub">No certificates issued yet. Yours is generated at the end of the quarter.</li>
              )}
            </ul>
          </div>

          <div className="border-t border-rule pt-4 text-[12px] leading-relaxed text-sub">
            <p className="text-[11px] uppercase tracking-[0.14em]">rights</p>
            <p className="mt-1">
              Your individual figures are visible only to you, your Floor Champion and the Group Sustainability
              team. Public leaderboards show floor totals, never individuals.{" "}
              <Link to="/about" className="underline decoration-rule underline-offset-4 hover:text-ink">
                Data retention policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
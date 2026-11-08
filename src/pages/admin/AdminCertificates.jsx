import { useMemo, useState } from "react";
import { useProgramme } from "@/lib/programmeData";
import { FLOOR_CODES, floorByCode, monthLabel, formatSgt } from "@/lib/programme";
import { downloadCertificate } from "@/lib/certPdf";
import { downloadCsv } from "@/lib/csv";
import AdminTable from "@/components/admin/AdminTable";
import StatusChip from "@/components/cb/StatusChip";
import Barcode from "@/components/cb/Barcode";
import Pill from "@/components/cb/Pill";

const PERIODS = [
  { key: "2026-10", label: "October 2026" },
  { key: "2026-11", label: "November 2026" },
];

export default function AdminCertificates() {
  const { certificates, rowsFor, me, setCertificateStatus, createCertificate } = useProgramme();
  const [period, setPeriod] = useState("2026-10");
  const [office, setOffice] = useState("Marina Bay");
  const [preview, setPreview] = useState(null);
  const [notice, setNotice] = useState("");

  const periodRows = useMemo(() => rowsFor(period), [rowsFor, period]);
  const list = certificates.filter((c) => c.period === period && c.office === office);

  const generateFloorCerts = async () => {
    const missing = periodRows.filter((r) => !list.find((c) => c.floorCode === r.code && c.type === "floor"));
    for (const r of missing) {
      await createCertificate({
        certId: `CB-FLR-${period}-${r.code}`,
        type: "floor",
        period,
        periodLabel: monthLabel(period),
        office,
        floorCode: r.code,
        kgCollected: Number((r.collected / 1000).toFixed(2)),
        kgReused: Number((r.reused / 1000).toFixed(2)),
        reuseRate: Number(r.reuseRate.toFixed(1)),
        rank: r.rank,
        nextTarget: `${((r.reused / 1000) * 1.15).toFixed(2)} kg reused · Set by Group Sustainability for the following month`,
        status: "draft",
        volunteeringHours: 0,
        activitiesDone: r.posts,
      });
    }
    setNotice(`${missing.length} floor certificates generated as drafts for ${monthLabel(period)}.`);
  };

  const issueAll = async () => {
    const drafts = list.filter((c) => c.status === "draft");
    for (const c of drafts) {
      await setCertificateStatus(c, "issued");
    }
    setNotice(`Issued all certificates for ${monthLabel(period)}.`);
  };

  const generateSummary = async () => {
    const collected = periodRows.reduce((s, r) => s + r.collected, 0);
    const reused = periodRows.reduce((s, r) => s + r.reused, 0);
    const certId = `CB-OFF-${period}-MB`;
    if (certificates.find((c) => c.certId === certId)) {
      setNotice("The office ESG summary for this month already exists.");
      return;
    }
    await createCertificate({
      certId,
      type: "office",
      period,
      periodLabel: monthLabel(period),
      office,
      floorCode: "ALL",
      kgCollected: Number((collected / 1000).toFixed(2)),
      kgReused: Number((reused / 1000).toFixed(2)),
      reuseRate: collected ? Number(((reused / collected) * 100).toFixed(1)) : 0,
      rank: 0,
      nextTarget: `${((reused / 1000) * 1.15).toFixed(2)} kg reused · Set by Group Sustainability`,
      status: "draft",
    });
    setNotice("Office ESG summary certificate generated as a draft.");
  };

  const dataPack = () => {
    downloadCsv(
      `coffeebot-esg-datapack-${period}.csv`,
      list,
      [
        { label: "Certificate ID", value: (r) => r.certId },
        { label: "Type", value: (r) => r.type },
        { label: "Period", value: (r) => r.periodLabel },
        { label: "Office", value: (r) => r.office },
        { label: "Floor", value: (r) => r.floorCode },
        { label: "Kg collected", value: (r) => r.kgCollected },
        { label: "Kg reused", value: (r) => r.kgReused },
        { label: "Reuse rate %", value: (r) => r.reuseRate },
        { label: "Rank", value: (r) => r.rank },
        { label: "Status", value: (r) => r.status },
        { label: "Issued by", value: (r) => r.issuedBy },
        { label: "Issued at", value: (r) => (r.issuedAt ? formatSgt(r.issuedAt) : "") },
      ]
    );
    list.filter((c) => c.status !== "revoked").forEach((c) => downloadCertificate(c, { floorName: floorByCode(c.floorCode).name }));
    setNotice("ESG data pack downloaded: CSV plus every certificate PDF.");
  };

  const revoke = async (cert) => {
    const reasonText = window.prompt("Reason for revoking this certificate (written to the audit log):");
    if (!reasonText || reasonText.trim().length < 5) return;
    await setCertificateStatus(cert, "revoked", reasonText.trim());
    setNotice(`${cert.certId} revoked. The audit log has been updated.`);
  };

  const summaryCert = list.find((c) => c.type === "office");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold">ESG Certificates</h1>
          <p className="text-[12px] text-sub">
            Floor and office certificates for the ESG report. Every issue and revocation is written to the audit log.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-8 border border-rule bg-white px-2 text-[12px]">
            {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <select value={office} onChange={(e) => setOffice(e.target.value)} className="h-8 border border-rule bg-white px-2 text-[12px]">
            {["Marina Bay", "Changi Business Park", "Raffles Place"].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {notice && (
        <div className="border border-verdant/40 bg-verdant/10 px-4 py-2 text-[12px] text-verdant">{notice}</div>
      )}

      <div className="flex flex-wrap gap-2">
        <Pill size="sm" variant="outline" onClick={generateFloorCerts}>generate floor certificates for {monthLabel(period)}</Pill>
        <Pill size="sm" onClick={issueAll}>issue all certificates for {monthLabel(period)}</Pill>
        <Pill size="sm" variant="outline" onClick={generateSummary}>generate office ESG summary</Pill>
        <Pill size="sm" variant="ghost" onClick={dataPack}>download ESG data pack (csv + all pdfs)</Pill>
      </div>

      <div className="border border-rule bg-paper p-4">
        <AdminTable
          exportName={`coffeebot-certificates-${period}.csv`}
          rows={list}
          emptyLabel="No certificates for this period yet. Generate the floor certificates to begin."
          initialSort={{ key: "floorCode", dir: "asc" }}
          columns={[
            { key: "certId", label: "Certificate ID", width: 190 },
            { key: "floorCode", label: "Floor", width: 70 },
            { key: "periodLabel", label: "Period" },
            { key: "kgCollected", label: "Kg collected", align: "right", render: (r) => Number(r.kgCollected).toFixed(2) },
            { key: "kgReused", label: "Kg reused", align: "right", render: (r) => Number(r.kgReused).toFixed(2) },
            { key: "reuseRate", label: "Reuse rate", align: "right", render: (r) => `${Number(r.reuseRate).toFixed(1)}%` },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusChip status={r.status}>{r.status}</StatusChip>,
            },
            { key: "issuedBy", label: "Issued by", render: (r) => r.issuedBy || "—" },
            { key: "issuedAt", label: "Issued at", render: (r) => (r.issuedAt ? formatSgt(r.issuedAt) : "—") },
            {
              key: "actions",
              label: "Actions",
              noSort: true,
              width: 210,
              render: (r) => (
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setPreview(r)} className="rounded-full border border-rule px-2 py-0.5 text-[11px] hover:border-ink">preview</button>
                  <button
                    type="button"
                    onClick={() => downloadCertificate(r, { floorName: floorByCode(r.floorCode).name })}
                    className="rounded-full border border-rule px-2 py-0.5 text-[11px] hover:border-ink"
                  >
                    pdf
                  </button>
                  {r.status === "draft" && (
                    <button type="button" onClick={() => setCertificateStatus(r, "issued")} className="rounded-full bg-ink px-2 py-0.5 text-[11px] text-white hover:bg-verdant">issue</button>
                  )}
                  {r.status === "issued" && (
                    <button type="button" onClick={() => revoke(r)} className="rounded-full border border-rule px-2 py-0.5 text-[11px] text-sub hover:border-[#A44A3F] hover:text-[#A44A3F]">revoke</button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      <div className="border border-rule bg-paper p-4">
        <p className="text-[13px] font-medium">Verification</p>
        <p className="mt-1 text-[12px] text-sub">
          Every certificate carries a QR code that opens a read-only page at <span className="text-ink">/verify/&lt;certificate id&gt;</span>.
          {summaryCert ? ` The office summary for ${monthLabel(period)} is ${summaryCert.certId}.` : " Generate the office ESG summary to complete the pack."}
        </p>
      </div>

      {preview && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-ink/45 px-4 py-8" onClick={() => setPreview(null)}>
          <div className="mx-auto max-w-[860px]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-paper p-6">
              <div className="flex items-start justify-between border-b border-rule pb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-sub">
                    {preview.type === "office" ? "office esg summary certificate" : "floor certificate"}
                  </p>
                  <p className="mt-1 text-[18px] font-semibold">
                    {preview.type === "office" ? "Marina Bay · all floors" : `${preview.floorCode} · ${floorByCode(preview.floorCode).name}`}
                  </p>
                  <p className="text-[12px] text-sub">
                    {preview.office} · {preview.periodLabel} · GRI 306-4 Waste diverted from disposal — preparation for reuse
                  </p>
                </div>
                <Barcode value={preview.certId} height={30} />
              </div>

              <table className="mt-5 w-full table-fixed border-collapse text-[12px]">
                <colgroup>
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "45%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="border-b border-rule py-2 text-left text-[10px] uppercase tracking-[0.12em] text-sub">Measure</th>
                    <th className="border-b border-rule py-2 text-left text-[10px] uppercase tracking-[0.12em] text-sub">Value</th>
                    <th className="border-b border-rule py-2 text-left text-[10px] uppercase tracking-[0.12em] text-sub">Evidence / basis</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Kg wet grounds collected", `${Number(preview.kgCollected).toFixed(2)} kg`, "Weighed at the collection table"],
                    ["Kg grounds reused", `${Number(preview.kgReused).toFixed(2)} kg`, "Reported by employees · validated by the Floor Champion"],
                    ["Reuse rate", `${Number(preview.reuseRate).toFixed(1)}%`, "Reused ÷ collected"],
                    ["Rank", preview.rank ? `${preview.rank} of 6` : "—", "kg reused per employee, all Marina Bay floors"],
                    ["Next target", (preview.nextTarget || "").split(" · ")[0], "Set by Group Sustainability"],
                    ["Avoided emissions", "Methodology pending", "Not reported for this period"],
                  ].map((row) => (
                    <tr key={row[0]} className="align-top">
                      <td className="border-b border-rule py-2 pr-2">{row[0]}</td>
                      <td className="border-b border-rule py-2 pr-2 font-semibold">{row[1]}</td>
                      <td className="border-b border-rule py-2 text-sub">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 flex flex-wrap items-end justify-between gap-4 text-[12px]">
                <div>
                  <div className="h-px w-48 bg-ink" />
                  <p className="mt-1">CoffeeBot Operations</p>
                </div>
                <div>
                  <div className="h-px w-56 bg-ink" />
                  <p className="mt-1">Head of Sustainability, Harbourline Bank</p>
                </div>
                <div className="text-right text-[11px] text-sub">
                  <p className="text-ink">{preview.certId}</p>
                  <p>/verify/{preview.certId}</p>
                  <p>{preview.issuedAt ? formatSgt(preview.issuedAt) : "not yet issued"}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Pill size="sm" variant="ghost" onClick={() => setPreview(null)}>close</Pill>
                <Pill size="sm" onClick={() => downloadCertificate(preview, { floorName: floorByCode(preview.floorCode).name })}>
                  download pdf
                </Pill>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
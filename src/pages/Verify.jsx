import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { IMG, HARBOURLINE_MARK } from "@/lib/assets";
import { formatSgt, floorByCode } from "@/lib/programme";
import StatusChip from "@/components/cb/StatusChip";
import Skeleton from "@/components/cb/Skeleton";

export default function Verify() {
  const { certificateId } = useParams();
  const [cert, setCert] = useState(undefined);

  useEffect(() => {
    (async () => {
      const res = await base44.entities.Certificate.filter({ certId: certificateId });
      const list = Array.isArray(res) ? res : res?.items || [];
      setCert(list[0] || null);
    })();
  }, [certificateId]);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="flex items-center justify-between border-b border-rule px-5 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <img src={IMG.logo} alt="CoffeeBot" className="h-7 w-auto" />
          <span className="h-5 w-px bg-rule" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-sub">certificate verification</span>
        </div>
        <span className="flex h-5 items-center border border-rule px-1.5 text-[8px] tracking-[0.14em] text-sub">
          {HARBOURLINE_MARK}
        </span>
      </header>

      <div className="mx-auto max-w-[720px] px-5 py-12">
        {cert === undefined && <Skeleton rows={5} />}

        {cert === null && (
          <div className="bg-paper p-8">
            <p className="text-[11px] uppercase tracking-[0.14em] text-sub">no certificate found</p>
            <h1 className="mt-2 text-[22px] text-ink">{certificateId} is not a certificate issued by this programme.</h1>
            <p className="mt-2 text-[13px] text-sub">
              Check the identifier printed under the QR code, or contact the Group Sustainability team at Harbourline
              Bank.
            </p>
            <Link to="/" className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-[13px] text-white">
              back to the programme
            </Link>
          </div>
        )}

        {cert && (
          <div className="bg-paper p-7">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-sub">
                  {cert.type === "office" ? "office esg summary certificate" : cert.type === "employee" ? "employee certificate" : "floor certificate"}
                </p>
                <h1 className="mt-1 text-[24px] font-semibold">
                  {cert.type === "office" ? "Marina Bay · all floors" : `${cert.floorCode} · ${floorByCode(cert.floorCode).name}`}
                </h1>
                <p className="text-[12px] text-sub">{cert.office} · {cert.periodLabel}</p>
              </div>
              <StatusChip status={cert.status}>{cert.status}</StatusChip>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-sub">kg wet grounds collected</dt>
                <dd className="tabular text-ink">{Number(cert.kgCollected).toFixed(2)} kg <span className="text-[11px] text-sub">weighed</span></dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-sub">kg reused</dt>
                <dd className="tabular text-ink">{Number(cert.kgReused).toFixed(2)} kg <span className="text-[11px] text-sub">validated</span></dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-sub">reuse rate</dt>
                <dd className="tabular text-ink">{Number(cert.reuseRate).toFixed(1)}%</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-sub">issued</dt>
                <dd className="text-ink">{cert.issuedAt ? formatSgt(cert.issuedAt) : "not issued"}</dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-rule pt-3 text-[12px] leading-relaxed text-sub">
              <p>
                GRI 306-4 Waste diverted from disposal — preparation for reuse. Evidence levels: Weighed at
                collection, Reported by employees, Validated by the Floor Champion.
              </p>
              {cert.status === "revoked" && (
                <p className="mt-2 text-[#A44A3F]">Revoked: {cert.revokedReason || "no reason recorded"}</p>
              )}
              <p className="mt-3 text-[11px] uppercase tracking-[0.12em]">{cert.certId}</p>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-sub">
          Read-only verification · CoffeeBot Re v2.3 · this page shows no individual data
        </p>
      </div>
    </div>
  );
}
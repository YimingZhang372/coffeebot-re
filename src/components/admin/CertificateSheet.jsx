import { IMG, HARBOURLINE_MARK } from "@/lib/assets";
import { formatSgt } from "@/lib/programme";
import { certMeta, certRows } from "@/lib/certModel";
import Barcode from "@/components/cb/Barcode";
import VerifyMatrix from "@/components/cb/VerifyMatrix";

const CHIP = {
  Weighed: "border-rule text-ink",
  Validated: "border-verdant/40 bg-verdant/10 text-verdant",
  Reported: "border-amberish/40 bg-amberish/10 text-amberish",
};

const EvidenceChip = ({ level }) => (
  <span className={`inline-flex h-[17px] shrink-0 items-center rounded-full border px-1.5 text-[9px] uppercase tracking-[0.1em] ${CHIP[level]}`}>
    {level}
  </span>
);

/** A4-landscape certificate: previewed on screen, mirrored line for line in the PDF. */
export default function CertificateSheet({ cert }) {
  const meta = certMeta(cert);
  const rows = certRows(cert);

  return (
    <div className="relative flex overflow-hidden rounded-[3px] bg-paper shadow-[0_24px_60px_-30px_rgba(20,20,20,0.5)]">
      <div className="min-w-0 flex-1 px-7 py-6">
        <div className="flex items-start justify-between gap-6 border-b border-rule pb-3">
          <div className="flex items-center gap-3">
            <img src={IMG.logo} alt="CoffeeBot" className="h-11 w-auto shrink-0" />
            <span className="h-8 w-px bg-rule" />
            <div>
              <span className="flex h-5 items-center border border-rule px-1.5 text-[8px] font-semibold tracking-[0.14em] text-ink">
                {HARBOURLINE_MARK}
              </span>
              <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-sub">Deployed at Harbourline Bank</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.16em] text-sub">sustainability certificate</p>
            <p className="mt-1 text-[11px] tabular text-ink">{cert.certId}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[9px] uppercase tracking-[0.16em] text-sub">{meta.kicker}</p>
          <h3 className="mt-1 text-[22px] font-semibold leading-tight text-ink">{meta.title}</h3>
          <p className="mt-0.5 text-[10.5px] text-sub">{meta.subtitle}</p>
        </div>

        <table className="mt-4 w-full table-fixed border-collapse text-[11px]">
          <colgroup>
            <col style={{ width: "30%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "45%" }} />
          </colgroup>
          <thead>
            <tr>
              {["Measure", "Value", "Evidence / basis"].map((h) => (
                <th key={h} className="border-b border-rule pb-1.5 text-left text-[9px] uppercase tracking-[0.12em] text-sub">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.measure} className="align-top">
                <td className="border-b border-rule/70 py-2 pr-3 text-ink">{r.measure}</td>
                <td className="border-b border-rule/70 py-2 pr-3 text-[12px] font-medium tabular text-ink">{r.value}</td>
                <td className="border-b border-rule/70 py-2">
                  <div className="flex items-start gap-2">
                    <EvidenceChip level={r.chip} />
                    <span className="text-[10.5px] leading-snug text-sub">{r.evidence}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-wrap gap-8">
            {meta.signatures.map((s) => (
              <div key={s.title} className="min-w-[168px]">
                <div className="h-px w-full bg-ink" />
                <p className="mt-1.5 text-[10.5px] text-ink">{s.name}</p>
                <p className="text-[9.5px] leading-snug text-sub">{s.title}</p>
                <p className="mt-0.5 text-[9.5px] text-sub">{s.date ? formatSgt(s.date, false) : "not yet issued"}</p>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-4">
            <div className="text-center">
              <VerifyMatrix value={cert.certId} size={70} className="border border-rule" />
              <p className="mt-1 text-[8px] uppercase tracking-[0.12em] text-sub">scan to verify</p>
            </div>
            <div className="text-center">
              <Barcode value={cert.certId} height={44} showValue={false} />
              <p className="mt-1 text-[8px] uppercase tracking-[0.12em] text-sub">/verify/{cert.certId}</p>
            </div>
          </div>
        </div>

        <p className="mt-4 border-t border-rule pt-2 text-[8.5px] uppercase tracking-[0.1em] text-sub">
          CoffeeBot Re v2.3 · evidence levels: weighed at collection, reported by employees, validated by the Floor
          Champion · {cert.status}
        </p>
      </div>

      <div className="relative hidden w-[62px] shrink-0 flex-col items-center justify-between border-l border-dashed border-rule bg-[#F7F5F3] px-3 py-6 sm:flex">
        <div className="h-px w-full bg-rule" />
        <Barcode value={cert.certId} height={150} className="rotate-90" showValue={false} />
        <div className="text-center text-[8px] uppercase leading-relaxed tracking-[0.12em] text-sub">
          {cert.period}
          <br />
          {cert.type === "office" ? "office" : cert.floorCode}
        </div>
      </div>
    </div>
  );
}
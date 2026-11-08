import { useState } from "react";
import { useProgramme } from "@/lib/programmeData";
import { monthLabel } from "@/lib/programme";
import AdminKpi from "@/components/admin/AdminKpi";
import Pill from "@/components/cb/Pill";

export default function AdminCarbon() {
  const { settings, saveSettings, office, month } = useProgramme();
  const carbon = settings?.carbon || {};
  const [form, setForm] = useState({
    alternativeRoute: carbon.alternativeRoute || "Incineration with energy recovery (Singapore)",
    emissionFactor: carbon.emissionFactor ?? 0.52,
    emissionFactorUnit: carbon.emissionFactorUnit || "kg CO2e per kg wet grounds",
    emissionFactorSource: carbon.emissionFactorSource || "",
    attributionPct: carbon.attributionPct ?? 100,
  });
  const [saved, setSaved] = useState(false);

  const kgReused = office.reused / 1000;
  const estimate = kgReused * Number(form.emissionFactor) * (Number(form.attributionPct) / 100);

  const save = async () => {
    await saveSettings(
      { carbon: { ...form, emissionFactor: Number(form.emissionFactor), attributionPct: Number(form.attributionPct) } },
      `Carbon assumptions updated: ${form.alternativeRoute}, ${form.emissionFactor} ${form.emissionFactorUnit}, attribution ${form.attributionPct}%.`
    );
    setSaved(true);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-semibold">Carbon module</h1>
        <p className="text-[12px] text-sub">
          Editable assumptions for the avoided-emissions estimate. Every result is labelled an estimate and is not
          part of the issued certificates.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="border border-rule bg-paper p-4">
          <p className="text-[13px] font-medium">Assumptions</p>
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.12em] text-sub">alternative route</span>
              <input
                value={form.alternativeRoute}
                onChange={(e) => setForm({ ...form, alternativeRoute: e.target.value })}
                className="mt-1 h-9 w-full border border-rule bg-white px-2 text-[12px]"
              />
              <span className="mt-1 block text-[11px] text-sub">Default for Singapore: incineration with energy recovery.</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.12em] text-sub">emission factor</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.emissionFactor}
                  onChange={(e) => setForm({ ...form, emissionFactor: e.target.value })}
                  className="mt-1 h-9 w-full border border-rule bg-white px-2 text-[12px] tabular"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.12em] text-sub">unit</span>
                <input
                  value={form.emissionFactorUnit}
                  onChange={(e) => setForm({ ...form, emissionFactorUnit: e.target.value })}
                  className="mt-1 h-9 w-full border border-rule bg-white px-2 text-[12px]"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.12em] text-sub">source</span>
              <input
                value={form.emissionFactorSource}
                onChange={(e) => setForm({ ...form, emissionFactorSource: e.target.value })}
                className="mt-1 h-9 w-full border border-rule bg-white px-2 text-[12px]"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.12em] text-sub">attribution %</span>
              <input
                type="number"
                value={form.attributionPct}
                onChange={(e) => setForm({ ...form, attributionPct: e.target.value })}
                className="mt-1 h-9 w-full border border-rule bg-white px-2 text-[12px] tabular"
              />
            </label>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Pill size="sm" onClick={save}>save assumptions</Pill>
            {saved && <span className="text-[11px] text-verdant">saved · written to the audit log</span>}
          </div>
        </div>

        <div className="space-y-3">
          <AdminKpi primary label={`avoided emissions · ${monthLabel(month)}`} value={estimate} decimals={2} unit="kg CO₂e" note="Estimate — not verified" />
          <AdminKpi label="kg reused in the estimate" value={kgReused} decimals={2} unit="kg" note="validated reuse records only" />
          <div className="border border-rule bg-paper p-4 text-[12px] leading-relaxed text-sub">
            <p className="text-[13px] text-ink">How this is calculated</p>
            <p className="mt-1">
              kg reused × emission factor ({form.emissionFactor} {form.emissionFactorUnit}) × attribution{" "}
              {form.attributionPct}%. The alternative route assumed is {form.alternativeRoute}.
            </p>
            <p className="mt-2 text-[#8F6539]">
              Every result in this module is labelled <span className="font-medium">Estimate - not verified</span>.
              Floor certificates report &ldquo;Methodology pending&rdquo; for avoided emissions.
            </p>
            {form.emissionFactorSource && <p className="mt-2">Source: {form.emissionFactorSource}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
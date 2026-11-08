import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useProgramme } from "@/lib/programmeData";
import { groundDropState } from "@/lib/groundDrop";
import { monthOf } from "@/lib/metrics";
import TowerView from "@/components/cb/TowerView";
import Pill from "@/components/cb/Pill";
import Ticket from "@/components/cb/Ticket";
import StatusChip from "@/components/cb/StatusChip";
import PhotoUpload from "@/components/cb/PhotoUpload";
import { FLOORS, formatSgt } from "@/lib/programme";

const LEVELS = ["L15", "L14", "L12", "L11", "L10", "L9", "L8", "L7"];

const statusOf = (stock) => (stock > 320 ? "available" : stock > 120 ? "low" : "empty");
const labelOf = (stock) => `${stock} g available`;

export default function Collect() {
  const { me, collections, settings, myRow, recordCollection, reuses } = useProgramme();
  const st = groundDropState(settings);
  const [selected, setSelected] = useState(me?.floorCode || "L10");
  const [flow, setFlow] = useState(null); // {step, grams, photo}
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const reduce = useReducedMotion();

  const floorData = useMemo(() => {
    const lastDrop = new Date(st.windowOpen ? st.nextDrop : st.nextDrop);
    return FLOORS.map((f) => {
      const since = collections.filter(
        (c) => c.floorCode === f.code && new Date(c.occurredAt) >= new Date(lastDrop.getTime() - 7 * 86400000)
      );
      const taken = since.reduce((s, c) => s + c.grams, 0);
      const stock = Math.max(0, 900 - taken);
      return {
        code: f.code,
        name: f.name,
        status: statusOf(stock),
        stock,
        stockLabel: labelOf(stock),
        nextLabel: st.nextLabel,
        taken,
        last: since.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))[0],
      };
    });
  }, [collections, st.nextDrop, st.windowOpen, st.nextLabel]);

  const levels = LEVELS.map((code) => {
    const f = floorData.find((x) => x.code === code);
    if (f) return f;
    return { code, name: "Harbourline offices", status: null, stock: 0, stockLabel: "—" };
  });

  const active = floorData.find((f) => f.code === selected) || floorData[2];

  const startFlow = () => {
    setResult(null);
    setFlow({ step: "grams", grams: "", photo: "" });
  };

  const press = (key) => {
    setFlow((prev) => {
      if (prev.step !== "grams") return prev;
      if (key === "del") return { ...prev, grams: prev.grams.slice(0, -1) };
      if (key === "clr") return { ...prev, grams: "" };
      const next = (prev.grams + key).replace(/^0+/, "").slice(0, 4);
      return { ...prev, grams: next };
    });
  };

  const confirm = async () => {
    if (!flow?.grams || Number(flow.grams) < 10) return;
    setSaving(true);
    const beforeRank = myRow?.rank;
    const created = await recordCollection({ grams: Number(flow.grams), proofPhotoUrl: flow.photo });
    const { reuses: _r } = { reuses };
    setSaving(false);
    setResult({ created, beforeRank, grams: Number(flow.grams), evidence: flow.photo ? "Weighed" : "Reported" });
    setFlow(null);
  };

  const monthCollections = collections.filter(
    (c) => c.employeeEmail === me?.email && monthOf(c.occurredAt) === monthOf(new Date().toISOString())
  );

  return (
    <div className="space-y-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-sub">collect · marina bay</p>
          <h1 className="display mt-3 text-[54px] sm:text-[88px]">collect.</h1>
          <p className="mt-3 max-w-[52ch] text-[14px] leading-relaxed text-sub">
            Grounds are not pre-bagged. On Ground Drop day the technician empties the machine bin into the lidded
            5 L caddy on your floor&rsquo;s table. Scoop into your own jar or a supplied lined kraft pouch, tare
            the scale, then weigh.
          </p>
        </div>
        <div className="text-right text-[11px] uppercase leading-relaxed tracking-[0.14em] text-sub">
          next drop {st.nextLabel} · {st.time}
          <br />
          clear-out {st.clearOutLabel}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="bg-white/40">
          <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
            <span className="text-[11px] uppercase tracking-[0.14em] text-sub">harbourline marina bay · tower</span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-sub">drag to orbit · scroll to zoom</span>
          </div>
          <TowerView
            floors={levels}
            selected={selected}
            myFloor={me?.floorCode}
            onSelect={setSelected}
          />
          <div className="flex flex-wrap items-center gap-4 border-t border-rule px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] text-sub">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-verdant" /> available</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amberish" /> running low</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#A8A29C]" /> empty</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border border-caramel" /> my floor</span>
            <span className="ml-auto normal-case tracking-normal">no L13</span>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-paper p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-sub">collection table</p>
                <p className="display mt-1 text-[30px]">{active.code}</p>
                <p className="text-[13px] text-sub">{active.name}</p>
              </div>
              <StatusChip
                status={active.status === "available" ? "validated" : active.status === "low" ? "pending" : "neutral"}
              >
                {active.status === "available" ? "available" : active.status === "low" ? "running low" : "empty"}
              </StatusChip>
            </div>
            <dl className="mt-4 divide-y divide-rule border-y border-rule text-[12px]">
              <div className="flex justify-between py-2">
                <dt className="text-sub">stock on table</dt>
                <dd className="tabular text-ink">{active.stock} g</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-sub">last weighed</dt>
                <dd className="tabular text-ink">
                  {active.last ? `${active.last.grams} g · ${formatSgt(active.last.occurredAt, false)}` : "no collections yet"}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-sub">next ground drop</dt>
                <dd className="text-ink">{st.nextLabel} · {st.time}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-sub">clear-out</dt>
                <dd className="text-ink">{st.clearOutLabel}</dd>
              </div>
            </dl>
            <Pill className="mt-4 w-full" onClick={startFlow} size="lg">
              I took grounds
            </Pill>
            <p className="mt-2 text-[11px] leading-relaxed text-sub">
              Weigh on the table scale and log it. {monthCollections.length} records logged by you this month.
            </p>
          </div>

          <div className="border-t border-rule pt-4">
            <h2 className="text-[15px] lowercase">all floor tables</h2>
            <div className="mt-2 divide-y divide-rule">
              {floorData.map((f) => (
                <button
                  key={f.code}
                  type="button"
                  onClick={() => setSelected(f.code)}
                  className={`flex w-full items-center gap-3 py-2.5 text-left ${f.code === selected ? "text-ink" : "text-sub hover:text-ink"}`}
                >
                  <span className="w-9 text-[12px] tabular">{f.code}</span>
                  <span className="flex-1 text-[13px]">{f.name}</span>
                  <span className="text-[12px] tabular">{f.stockLabel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {flow && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-8 backdrop-blur-sm">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="w-full max-w-[520px]"
          >
            <div className="bg-paper p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-sub">
                    step {flow.step === "grams" ? "1 of 2" : "2 of 2"} · {active.code} table
                  </p>
                  <h2 className="mt-1 text-[20px] lowercase">
                    {flow.step === "grams" ? "what did the scale read?" : "take proof photo"}
                  </h2>
                </div>
                <button type="button" onClick={() => setFlow(null)} className="text-[13px] text-sub hover:text-ink">
                  cancel
                </button>
              </div>

              {flow.step === "grams" && (
                <div className="mt-5">
                  <div className="flex items-baseline justify-between border-b border-rule pb-2">
                    <span className="text-[12px] uppercase tracking-[0.14em] text-sub">grams · tare first</span>
                    <span className="display text-[52px] tabular">{flow.grams || "0"}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "clr", "0", "del"].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => press(k)}
                        className="h-14 rounded-full border border-rule bg-white text-[17px] tabular transition-colors hover:border-ink"
                      >
                        {k === "clr" ? "clear" : k === "del" ? "delete" : k}
                      </button>
                    ))}
                  </div>
                  <Pill
                    className="mt-4 w-full"
                    size="lg"
                    disabled={!flow.grams || Number(flow.grams) < 10}
                    onClick={() => setFlow({ ...flow, step: "photo" })}
                  >
                    continue to proof photo
                  </Pill>
                </div>
              )}

              {flow.step === "photo" && (
                <div className="mt-5 space-y-4">
                  <PhotoUpload
                    value={flow.photo}
                    onChange={(url) => setFlow({ ...flow, photo: url })}
                    visibility="private"
                    label="take proof photo"
                    hint="container on the scale, display readable"
                  />
                  <p className="text-[12px] leading-relaxed text-sub">
                    A proof photo gives the record the evidence level <span className="text-ink">Weighed</span>.
                    Without it the record is <span className="text-ink">Reported</span> and appears in the
                    administrator&rsquo;s review queue. Proof photos are visible to your Floor Champion and
                    administrators only, never in the feed.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Pill size="lg" onClick={confirm} disabled={saving || !flow.photo}>
                      {saving ? "recording…" : `confirm ${flow.grams} g`}
                    </Pill>
                    <Pill size="lg" variant="outline" onClick={confirm} disabled={saving}>
                      record without photo
                    </Pill>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {result && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-[560px]">
            <Ticket id={result.created?.refId} rotate={-2.2} barcode>
              <p className="text-[11px] uppercase tracking-[0.14em] text-sub">collection recorded</p>
              <h2 className="display mt-2 text-[44px]">{result.grams} g</h2>
              <p className="mt-1 text-[13px] text-sub">
                {result.created?.refId} · {formatSgt(result.created?.occurredAt)} · evidence {result.evidence}
              </p>

              <div className="mt-5 flex items-center gap-4">
                <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
                  <circle cx="38" cy="38" r="32" fill="none" stroke="#CFCBC6" strokeWidth="4" />
                  <motion.circle
                    cx="38"
                    cy="38"
                    r="32"
                    fill="none"
                    stroke="hsl(var(--cb-green))"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 32}
                    initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - Math.min(1, result.grams / 500)) }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  />
                </svg>
                <motion.p
                  initial={reduce ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                  className="text-[15px] text-ink"
                >
                  +{result.grams} g · {me?.floorCode}{" "}
                  {myRow && result.beforeRank && myRow.rank !== result.beforeRank
                    ? `moves to ${myRow.rank}${myRow.rank === 1 ? "st" : myRow.rank === 2 ? "nd" : myRow.rank === 3 ? "rd" : "th"}`
                    : `stays ${myRow?.rank || result.beforeRank}`}
                </motion.p>
              </div>

              <p className="mt-4 text-[13px] leading-relaxed text-sub">
                Use within 48 h or dry them. Share your reuse within 14 days to add the grams to your floor score.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Pill to="/community" size="sm">share my reuse</Pill>
                <Pill variant="outline" size="sm" onClick={() => setResult(null)}>close</Pill>
              </div>
            </Ticket>
          </div>
        </div>
      )}
    </div>
  );
}
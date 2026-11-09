import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useProgramme } from "@/lib/programmeData";
import { bidPhase, clockLabel, monthTitle, shortDate, pts } from "@/lib/pledge";
import AdminTable from "@/components/admin/AdminTable";
import Pill from "@/components/cb/Pill";
import StatusChip from "@/components/cb/StatusChip";

const all = async (promise) => {
  const res = await promise;
  return Array.isArray(res) ? res : res?.items || [];
};

const SANDBOX_URL = `${typeof window !== "undefined" ? window.location.origin : ""}/pledge-room/demo`;
const QR = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(SANDBOX_URL)}`;

export default function AdminPledges() {
  const { board, config, month, pledges, dropsDone, logEvent, me, saveSettings } = useProgramme();
  const [round, setRound] = useState(null);
  const [bidCount, setBidCount] = useState(0);
  const [notice, setNotice] = useState("");
  const [code, setCode] = useState(String(config.joinCode || ""));

  const loadRound = useCallback(async () => {
    const [r, b] = await Promise.all([
      all(base44.entities.SandboxRound.filter({ key: "demo" })),
      all(base44.entities.SandboxBid.filter({ roundKey: "demo" })),
    ]);
    setRound(r[0] || null);
    setBidCount(b.length);
  }, []);

  useEffect(() => {
    loadRound();
  }, [loadRound]);

  const phase = bidPhase(config);

  const audit = async (detail) => {
    await logEvent({
      eventType: "sandbox.started",
      employeeLabel: "Programme administrator",
      employeeEmail: me?.email || "",
      floorCode: "ALL",
      quantity: 0,
      status: "Sandbox",
      actor: me?.name || "Programme administrator",
      entityRef: "PLEDGE-ROOM-DEMO",
      detail,
      auditable: true,
    });
  };

  const startRound = async () => {
    if (round) await base44.entities.SandboxRound.update(round.id, { status: "bidding", winner: "", revealedAt: null });
    else await base44.entities.SandboxRound.create({ key: "demo", status: "bidding", startedAt: new Date().toISOString() });
    await audit("Sandbox pledge round started for the booth and class sessions.");
    setNotice("Sandbox round open. Share the link or the QR code.");
    loadRound();
  };

  const resetRound = async () => {
    await base44.entities.SandboxBid.deleteMany({ roundKey: "demo" });
    if (round) await base44.entities.SandboxRound.update(round.id, { status: "bidding", winner: "", revealedAt: null });
    setNotice("Sandbox round reset. Real programme records were not touched.");
    loadRound();
  };

  const saveCode = async (value) => {
    const clean = String(value).replace(/\D/g, "").slice(0, 4);
    if (clean && clean.length !== 4) {
      setNotice("The join code must be four digits.");
      return;
    }
    await saveSettings(
      {
        pledge: {
          pledgeNightAt: config.pledgeNightAt,
          finalBidOpenAt: config.finalBidOpenAt,
          finalBidCloseAt: config.finalBidCloseAt,
          monthCloseAt: config.monthCloseAt,
          nextPledgeNightAt: config.nextPledgeNightAt,
          multipliers: config.multipliers,
          caps: config.caps,
          joinCode: clean,
        },
      },
      clean
        ? `Sandbox pledge room join code set to ${clean}.`
        : "Sandbox pledge room join code removed; the room is open again."
    );
    setCode(clean);
    setNotice(clean ? `Join code ${clean} is live. Visitors must enter it before bidding.` : "Join code removed.");
  };

  const rows = board.map((r) => ({
    ...r,
    bidLabel: r.finalBid != null ? `${r.bid}% → ${r.finalBid}%` : `${r.bid}%`,
    toDateR: Math.round(r.toDate),
    projectedR: Math.round(r.projected),
    volumeR: Math.round(r.volumePts),
    upliftR: Number(r.upliftPts.toFixed(1)),
    scoreR: Math.round(r.score),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold">Pledges</h1>
          <p className="text-[12px] text-sub">
            {monthTitle(month)} auction · {dropsDone} of 4 Ground Drops held · final bid{" "}
            {phase.open ? "window open" : phase.phase === "before" ? `opens ${shortDate(config.finalBidOpenAt)}` : "closed"}
          </p>
        </div>
        <StatusChip status={phase.open ? "validated" : "pending"}>
          {phase.open ? "final bid open" : "projected only"}
        </StatusChip>
      </div>

      {notice && <div className="border border-verdant/40 bg-verdant/10 px-4 py-2 text-[12px] text-verdant">{notice}</div>}

      <div className="border border-rule bg-paper p-4">
        <p className="text-[13px] font-medium">Auction table · {monthTitle(month)}</p>
        <p className="mt-1 text-[12px] text-sub">
          Baselines are each floor&rsquo;s best of the previous three months. Caps {config.caps.volume} /{" "}
          {config.caps.uplift}; multipliers met {config.multipliers.met} · missed {config.multipliers.missed} · final{" "}
          {config.multipliers.finalMet} / {config.multipliers.finalMissed}.
        </p>
        <div className="mt-3">
          <AdminTable
            exportName={`coffeebot-pledges-${month}.csv`}
            rows={rows}
            initialSort={{ key: "scoreR", dir: "desc" }}
            columns={[
              { key: "rank", label: "Rank", width: 56 },
              { key: "code", label: "Floor", width: 70 },
              { key: "name", label: "Department" },
              { key: "bidLabel", label: "Bid" },
              { key: "baselinePer", label: "Baseline g", align: "right" },
              { key: "toDateR", label: "To date g", align: "right" },
              { key: "projectedR", label: "Projected g", align: "right" },
              { key: "volumeR", label: "Volume pts", align: "right" },
              { key: "upliftR", label: "Uplift pts", align: "right", render: (r) => pts(r.upliftPts) },
              { key: "scoreR", label: "Score", align: "right" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="border border-rule bg-paper p-4">
          <p className="text-[13px] font-medium">Bid history</p>
          <ul className="mt-3 divide-y divide-rule text-[12px]">
            {pledges
              .filter((p) => p.month === month)
              .flatMap((p) => (p.bids || []).map((b, i) => ({ ...b, code: p.floorCode, key: `${p.id}-${i}` })))
              .sort((a, b) => (a.at < b.at ? 1 : -1))
              .map((b) => (
                <li key={b.key} className="flex items-center gap-3 py-2">
                  <span className="w-10 text-ink">{b.code}</span>
                  <span className="tabular text-ink">+{b.pct}%</span>
                  <span className="text-sub">{b.kind}</span>
                  <span className="ml-auto truncate text-sub">{b.by}</span>
                </li>
              ))}
            {!pledges.some((p) => p.month === month) && <li className="py-3 text-sub">No bids recorded for this month.</li>}
          </ul>
          <p className="mt-3 text-[11px] text-sub">
            Final bid window {shortDate(config.finalBidOpenAt)} {clockLabel(config.finalBidOpenAt)} to{" "}
            {shortDate(config.finalBidCloseAt)} {clockLabel(config.finalBidCloseAt)}. Month closes{" "}
            {shortDate(config.monthCloseAt)} {clockLabel(config.monthCloseAt)}. Next Pledge Night{" "}
            {shortDate(config.nextPledgeNightAt)} {clockLabel(config.nextPledgeNightAt)}.
          </p>
        </div>

        <div className="border border-rule bg-paper p-4">
          <p className="text-[13px] font-medium">Sandbox round</p>
          <p className="mt-1 text-[12px] leading-relaxed text-sub">
            A public round for live events, the booth and class sessions at a fixed route. It never touches real
            programme records.
          </p>

          <div className="mt-3 flex items-center gap-3">
            <img
              src={QR}
              alt="QR code for the pledge room"
              width={110}
              height={110}
              className="border border-rule bg-white p-1"
            />
            <div className="min-w-0 text-[12px]">
              <p className="truncate text-ink">{SANDBOX_URL}</p>
              <p className="mt-1 text-sub">
                status <span className="text-ink">{round?.status || "closed"}</span> · {bidCount} bids
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill size="sm" onClick={startRound}>{round ? "restart round" : "start sandbox round"}</Pill>
                <Pill size="sm" variant="outline" onClick={resetRound}>reset</Pill>
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-sub">
            Participants bid, use final bid, then reveal or reset on the page itself. Starting and resetting here is
            written to the audit log.
          </p>

          <div className="mt-3 border-t border-rule pt-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-sub">join code</p>
            <p className="mt-1 text-[12px] leading-relaxed text-sub">
              Four digits the host reads out. Visitors must enter it on the demo page before they can bid. Leave it empty
              to keep the room open.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="0000"
                aria-label="Demo join code"
                className="h-9 w-24 border border-rule bg-white px-3 text-[14px] tabular tracking-[0.3em] outline-none focus:border-ink"
              />
              <Pill size="sm" onClick={() => saveCode(code)}>save code</Pill>
              <button
                type="button"
                onClick={() => saveCode("")}
                className="rounded-full border border-rule px-3 py-1.5 text-[12px] lowercase text-sub hover:border-ink hover:text-ink"
              >
                remove code
              </button>
              <span className="text-[11px] text-sub">
                {config.joinCode ? `live: ${config.joinCode}` : "no code set · bidding is open"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
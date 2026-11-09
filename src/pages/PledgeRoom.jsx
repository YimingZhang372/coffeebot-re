import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { SANDBOX_FLOORS, sandboxScore } from "@/lib/pledge";
import { IMG, HARBOURLINE_MARK } from "@/lib/assets";
import { Image } from "@/components/ui/image";
import Barcode from "@/components/cb/Barcode";

const KEY = "demo";

const all = async (promise) => {
  const res = await promise;
  return Array.isArray(res) ? res : res?.items || [];
};

/** Public sandbox round at a fixed route. Never touches real programme records. */
export default function PledgeRoom() {
  const [round, setRound] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [joinCode, setJoinCode] = useState("");
  const [codeEntry, setCodeEntry] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [codeError, setCodeError] = useState("");

  const load = useCallback(async () => {
    const [r, b, s] = await Promise.all([
      all(base44.entities.SandboxRound.filter({ key: KEY })),
      all(base44.entities.SandboxBid.filter({ roundKey: KEY }, { sort: "-createdAt", limit: 200 })),
      all(base44.entities.ProgrammeSetting.list({ limit: 1 })),
    ]);
    setRound(r[0] || null);
    setBids(b);
    setJoinCode(String(s[0]?.pledge?.joinCode || ""));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const offBids = base44.entities.SandboxBid.subscribe(() => load());
    const offRound = base44.entities.SandboxRound.subscribe(() => load());
    return () => {
      offBids?.();
      offRound?.();
    };
  }, [load]);

  const latest = useMemo(() => {
    const map = {};
    bids.forEach((b) => {
      if (!map[b.floor] || new Date(b.createdAt) > new Date(map[b.floor].createdAt)) map[b.floor] = b;
    });
    return map;
  }, [bids]);

  const status = round?.status || "closed";
  const revealed = status === "revealed";
  const needsCode = Boolean(joinCode) && !unlocked;

  const board = useMemo(
    () =>
      SANDBOX_FLOORS.map((f) => {
        const bid = latest[f.floor]?.bid ?? 0;
        const scored = revealed ? sandboxScore(f, bid, f.result) : null;
        return { ...f, bid, scored };
      }).sort((a, b) => (b.scored?.score || 0) - (a.scored?.score || 0)),
    [latest, revealed]
  );

  const start = async () => {
    setBusy(true);
    try {
      if (round) await base44.entities.SandboxRound.update(round.id, { status: "bidding", winner: "" });
      else
        await base44.entities.SandboxRound.create({
          key: KEY,
          status: "bidding",
          startedAt: new Date().toISOString(),
        });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const bid = async (floor) => {
    const value = Math.round(Number(drafts[floor]));
    const current = latest[floor]?.bid;
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setError("Enter a whole percentage between 0 and 100.");
      return;
    }
    if (current != null && value <= current) {
      setError("A floor's bid can only be raised.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await base44.entities.SandboxBid.create({
        roundKey: KEY,
        floor,
        bid: value,
        kind: status === "final" ? "final" : "opening",
        bidder: "room bid",
        createdAt: new Date().toISOString(),
      });
      setDrafts((d) => ({ ...d, [floor]: "" }));
      await load();
    } finally {
      setBusy(false);
    }
  };

  const advance = async (next) => {
    setBusy(true);
    try {
      const winner = next === "revealed"
        ? board
            .map((f) => ({ floor: f.floor, score: sandboxScore(f, f.bid, f.result).score }))
            .sort((a, b) => b.score - a.score)[0]?.floor || ""
        : "";
      await base44.entities.SandboxRound.update(round.id, {
        status: next,
        winner,
        revealedAt: next === "revealed" ? new Date().toISOString() : round.revealedAt,
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      if (bids.length) await base44.entities.SandboxBid.deleteMany({ roundKey: KEY });
      if (round) await base44.entities.SandboxRound.update(round.id, { status: "bidding", winner: "", revealedAt: null });
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="bg-ink px-5 py-2 text-center text-[11px] uppercase tracking-[0.12em] text-[#d8d4cf]">
        Demo round · not linked to Harbourline records · resets after each session
      </div>

      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-rule px-5 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <img src={IMG.logo} alt="CoffeeBot" className="h-9 w-auto" />
          <span className="hidden h-6 w-px bg-rule sm:block" />
          <span className="hidden text-[11px] uppercase tracking-[0.14em] text-sub sm:block">pledge room · sandbox</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-sub">
          <span className="flex h-5 items-center border border-rule px-1.5 text-[8px] tracking-[0.14em]">{HARBOURLINE_MARK}</span>
          <Link to="/" className="hover:text-ink">programme</Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-5 py-8 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-sub">sandbox round · training only</p>
            <h1 className="display mt-2 text-[40px] sm:text-[62px]">pledge room.</h1>
            <p className="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-sub">
              Pick a floor and bid the uplift you would pledge. Bids appear live on the board. The final bid round is
              raise only. Reveal applies the hidden results and scores with the programme rules.
            </p>
          </div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-sub">
            status <span className="text-ink">{status}</span>
            <br />
            {bids.length} bids in this round
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {(!round || status === "closed") && (
            <button type="button" disabled={busy} onClick={start} className="rounded-full bg-ink px-4 py-2 text-[12px] lowercase text-white hover:bg-caramel disabled:opacity-40">
              start a round
            </button>
          )}
          {status === "bidding" && (
            <button type="button" disabled={busy} onClick={() => advance("final")} className="rounded-full border border-ink px-4 py-2 text-[12px] lowercase hover:border-caramel hover:text-caramel">
              final bid
            </button>
          )}
          {status !== "revealed" && round && (
            <button type="button" disabled={busy} onClick={() => advance("revealed")} className="rounded-full bg-ink px-4 py-2 text-[12px] lowercase text-white hover:bg-caramel">
              reveal
            </button>
          )}
          {round && (
            <button type="button" disabled={busy} onClick={reset} className="rounded-full border border-rule px-4 py-2 text-[12px] lowercase text-sub hover:border-ink hover:text-ink">
              reset
            </button>
          )}
          {status === "final" && <span className="text-[11px] uppercase tracking-[0.12em] text-caramel">final bid · raise only</span>}
        </div>

        {error && <p className="mt-3 text-[12px] text-[#A44A3F]">{error}</p>}

        {needsCode && (
          <div className="mt-6 flex flex-wrap items-end gap-3 border border-ink bg-paper p-4">
            <div className="min-w-[220px] flex-1">
              <p className="text-[10px] uppercase tracking-[0.14em] text-sub">join code</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-sub">
                The host reads out a four-digit code. Enter it to place bids in this demo round.
              </p>
            </div>
            <input
              inputMode="numeric"
              value={codeEntry}
              onChange={(e) => {
                setCodeEntry(e.target.value.replace(/\D/g, "").slice(0, 4));
                setCodeError("");
              }}
              placeholder="0000"
              aria-label="Four-digit join code"
              className="h-11 w-24 border border-rule bg-white px-3 text-[16px] tabular tracking-[0.3em] outline-none focus:border-ink"
            />
            <button
              type="button"
              disabled={codeEntry.length !== 4}
              onClick={() => {
                if (codeEntry === joinCode) setUnlocked(true);
                else setCodeError("That code does not match the one on screen.");
              }}
              className="h-11 rounded-full bg-ink px-5 text-[12px] lowercase text-white transition-colors hover:bg-caramel disabled:opacity-40"
            >
              join the round
            </button>
            {codeError && <p className="w-full text-[12px] text-[#A44A3F]">{codeError}</p>}
          </div>
        )}

        {loading ? (
          <p className="mt-8 text-[13px] text-sub">Loading the board…</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {board.map((f) => (
              <div
                key={f.floor}
                className={`border bg-paper p-4 ${revealed && round?.winner === f.floor ? "border-caramel" : "border-rule"}`}
              >
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-sub">floor {f.floor}</p>
                    <p className="display mt-1 text-[30px] leading-none">{f.floor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-sub">bid</p>
                    <p className="tabular text-[20px] text-ink">{f.bid ? `+${f.bid}%` : "—"}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-y border-rule py-2 text-[12px]">
                  <div className="flex justify-between"><span className="text-sub">baseline</span><span className="tabular">{f.baseline} g</span></div>
                  <div className="flex justify-between"><span className="text-sub">last 4 weeks</span><span className="tabular">{f.weeks.join(" · ")}</span></div>
                </div>

                {revealed ? (
                  <div className="mt-3 space-y-1 text-[12.5px]">
                    <div className="flex justify-between"><span className="text-sub">result</span><span className="tabular text-ink">{f.result} g</span></div>
                    <div className="flex justify-between"><span className="text-sub">volume points</span><span className="tabular text-ink">{Math.round(f.scored.volumePts)}</span></div>
                    <div className="flex justify-between"><span className="text-sub">uplift points</span><span className="tabular text-ink">{f.scored.upliftPts.toFixed(1)}</span></div>
                    <div className="flex justify-between border-t border-rule pt-1"><span className="text-sub">score</span><span className="tabular text-[16px] text-ink">{Math.round(f.scored.score)}</span></div>
                    {round?.winner === f.floor && (
                      <p className="pt-1 text-[10px] uppercase tracking-[0.14em] text-caramel">winner</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      inputMode="numeric"
                      value={drafts[f.floor] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [f.floor]: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                      placeholder="+%"
                      disabled={needsCode}
                      className="h-10 w-20 border border-rule bg-white px-3 text-[14px] tabular outline-none focus:border-ink disabled:opacity-40"
                    />
                    <button
                      type="button"
                      disabled={busy || !round || status === "closed" || needsCode}
                      onClick={() => bid(f.floor)}
                      className="rounded-full bg-ink px-4 py-2 text-[12px] lowercase text-white transition-colors hover:bg-caramel disabled:opacity-40"
                    >
                      bid
                    </button>
                    <span className="text-[11px] text-sub">
                      {needsCode
                        ? "enter the join code to bid"
                        : latest[f.floor]
                        ? `raised from +${latest[f.floor].bid}%`
                        : "no bid yet"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-rule pt-4 text-[11px] uppercase tracking-[0.12em] text-sub">
          <Barcode value="PLEDGE-ROOM-DEMO" height={20} showValue={false} className="w-[110px]" />
          <span>sandbox data is separate from the programme</span>
          <span className="ml-auto normal-case tracking-normal">
            every floor&rsquo;s figures come from this round&rsquo;s bids and the hidden results
          </span>
        </div>
      </main>
    </div>
  );
}
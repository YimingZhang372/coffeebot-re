import { useEffect, useState } from "react";
import Pill from "@/components/cb/Pill";

/** Champion bid entry. A lower value than the current bid is refused. */
export default function BidDialog({ open, mode = "opening", floorCode, current, windowLabel, onClose, onSubmit }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(current != null ? String(current + 5) : "20");
      setError("");
      setBusy(false);
    }
  }, [open, current]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 100) {
      setError("Enter a whole percentage between 0 and 100.");
      return;
    }
    if (current != null && n <= current) {
      setError("Bids can only be raised");
      return;
    }
    setBusy(true);
    try {
      await onSubmit(n, mode);
      onClose();
    } catch (err) {
      setError(err?.message || "The bid could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] rounded-[2px] bg-paper p-5"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-sub">
              {mode === "opening" ? "opening bid" : "final bid · raise only"} · {floorCode}
            </p>
            <h2 className="mt-1 text-[19px] text-ink">
              {mode === "opening" ? "Pledge your uplift" : "Raise your bid"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-[12px] text-sub hover:text-ink">close ✕</button>
        </div>

        <p className="mt-2 text-[12.5px] leading-relaxed text-sub">
          {mode === "opening"
            ? "Bid the % more g reused per employee your floor will reach against its baseline this month."
            : "A raise you make once, in the final bid window. It applies to the whole month and can never be lowered."}
          {windowLabel ? ` ${windowLabel}` : ""}
        </p>

        <label className="mt-4 block">
          <span className="text-[10px] uppercase tracking-[0.14em] text-sub">uplift bid · whole %</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(""); }}
              autoFocus
              className="h-12 w-24 border border-rule bg-white px-3 text-[18px] tabular outline-none focus:border-ink"
            />
            <span className="text-[16px] text-sub">%</span>
            {current != null && (
              <span className="ml-auto text-[11px] uppercase tracking-[0.1em] text-sub">current {current}%</span>
            )}
          </div>
        </label>

        {error && <p className="mt-3 text-[12px] text-[#A44A3F]">{error}</p>}

        <div className="mt-4 flex items-center gap-2">
          <Pill type="submit" size="sm" disabled={busy}>{busy ? "saving…" : mode === "opening" ? "place bid" : "raise bid"}</Pill>
          <Pill type="button" size="sm" variant="ghost" onClick={onClose}>cancel</Pill>
          <span className="ml-auto text-[10px] uppercase tracking-[0.1em] text-sub">logged to the audit trail</span>
        </div>
      </form>
    </div>
  );
}
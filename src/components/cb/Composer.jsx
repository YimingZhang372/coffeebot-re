import { useState } from "react";
import { Link } from "react-router-dom";
import { ACTIVITIES } from "@/lib/programme";
import { useProgramme } from "@/lib/programmeData";
import { useToast } from "@/components/ui/use-toast";
import PhotoUpload from "./PhotoUpload";
import Pill from "./Pill";

export default function Composer({ onDone, prefill = "", autoOpen = false }) {
  const { me, submitReuse, myCollections, myReuses } = useProgramme();
  const { toast } = useToast();
  const [open, setOpen] = useState(autoOpen || !!prefill);
  const [photo, setPhoto] = useState("");
  const [activityKey, setActivityKey] = useState("plant");
  const [grams, setGrams] = useState("");
  const [note, setNote] = useState(prefill);
  const [showName, setShowName] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const collected = myCollections.reduce((s, c) => s + (c.grams || 0), 0);
  const alreadyReused = myReuses.filter((r) => r.status !== "rejected").reduce((s, r) => s + (r.grams || 0), 0);
  const remaining = Math.max(0, collected - alreadyReused);

  const submit = async (e) => {
    e.preventDefault();
    const g = Number(grams);
    if (!photo) return setError("Attach a photo of the reused grounds.");
    if (!grams || !Number.isFinite(g) || g <= 0) return setError("Enter the grams reused. It must be more than 0.");
    if (g > remaining) {
      return setError(
        remaining
          ? `That is more than your weighed grounds not yet reused (${remaining} g left).`
          : "You have no weighed grounds waiting to be reused. Log a collection first."
      );
    }
    if (note.trim().length < 5) return setError("Add a short note (at least 5 characters).");
    setError("");
    setBusy(true);
    try {
      const created = await submitReuse({ activityKey, grams: g, note: note.trim(), photoUrl: photo, showName });
      setDone(created);
      setPhoto("");
      setGrams("");
      setNote("");
      toast({ title: `Submitted · ${created.refId}`, description: "Pending validation by your Floor Champion." });
      onDone?.();
    } catch (err) {
      setError(err?.message || "The record could not be submitted. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="bg-paper p-5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-sub">submitted · pending validation</p>
        <p className="mt-2 text-[17px] text-ink">{done.refId} is with the {me?.floorCode} Floor Champion.</p>
        <p className="mt-1 text-[13px] leading-relaxed text-sub">
          Your post is at the top of the feed now. Points are added to your floor the moment it is validated, and the
          pledge board updates with it.
        </p>
        <div className="mt-3 flex gap-2">
          <Pill size="sm" onClick={() => setDone(null)}>share another</Pill>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 border border-rule bg-paper px-4 py-4 text-left transition-colors hover:border-ink"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[11px] text-white">
          {(me?.name || "—").split(" ").slice(0, 2).map((p) => p[0]).join("")}
        </span>
        <span>
          <span className="block text-[14px] text-ink">share a reuse</span>
          <span className="block text-[12px] text-sub">
            photo, grams reused and a short note · {remaining} g of your weighed grounds left to reuse
          </span>
        </span>
        <span className="ml-auto text-[12px] text-sub">open</span>
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 border border-rule bg-paper p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink">new reuse record · {me?.floorCode}</p>
        <button type="button" onClick={() => setOpen(false)} className="text-[12px] text-sub hover:text-ink">
          close
        </button>
      </div>

      <PhotoUpload value={photo} onChange={setPhoto} visibility="public" label="add photo" hint="the reused grounds at home" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.14em] text-sub">activity</span>
          <select
            value={activityKey}
            onChange={(e) => setActivityKey(e.target.value)}
            className="mt-1 h-11 w-full border border-rule bg-white px-3 text-[13px] outline-none focus:border-ink"
          >
            {ACTIVITIES.map((a) => (
              <option key={a.key} value={a.key}>{a.name} · {a.tag}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.14em] text-sub">grams reused</span>
          <input
            inputMode="numeric"
            value={grams}
            onChange={(e) => { setGrams(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }}
            placeholder="150"
            className="mt-1 h-11 w-full border border-rule bg-white px-3 text-[13px] tabular outline-none focus:border-ink"
          />
          <span className="mt-1 block text-[10.5px] text-sub">
            {remaining > 0 ? `${remaining} g weighed and not yet reused` : "no weighed grounds left to reuse"}
          </span>
        </label>
      </div>

      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.14em] text-sub">note · {note.length}/280</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 280))}
          rows={3}
          placeholder="What did you do with them?"
          className="mt-1 w-full resize-none border border-rule bg-white px-3 py-2 text-[13px] outline-none focus:border-ink"
        />
      </label>

      <label className="flex items-center gap-2 text-[12px] text-sub">
        <input
          type="checkbox"
          checked={showName}
          onChange={(e) => setShowName(e.target.checked)}
          className="h-4 w-4 accent-[hsl(var(--cb-caramel))]"
        />
        show my first name (off by default — posts appear as {me?.floorCode} colleague)
      </label>

      {error && (
        <p className="text-[12px] text-[#A44A3F]">
          {error}{" "}
          {remaining <= 0 && (
            <Link to="/collect" className="underline decoration-rule underline-offset-4 hover:text-ink">
              log a collection
            </Link>
          )}
        </p>
      )}
      <Pill type="submit" disabled={busy}>{busy ? "submitting…" : "submit reuse record"}</Pill>
    </form>
  );
}
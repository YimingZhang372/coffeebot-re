import { useState } from "react";
import { ACTIVITIES } from "@/lib/programme";
import { useProgramme } from "@/lib/programmeData";
import PhotoUpload from "./PhotoUpload";
import Pill from "./Pill";

export default function Composer({ onDone }) {
  const { me, submitReuse } = useProgramme();
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState("");
  const [activityKey, setActivityKey] = useState("plant");
  const [grams, setGrams] = useState("");
  const [note, setNote] = useState("");
  const [showName, setShowName] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const g = Number(grams);
    if (!photo) return setError("Attach a photo of the reused grounds.");
    if (!Number.isFinite(g) || g < 10 || g > 2000) return setError("Enter grams reused between 10 and 2000.");
    if (note.trim().length < 5) return setError("Add a short note (at least 5 characters).");
    setError("");
    setBusy(true);
    const created = await submitReuse({ activityKey, grams: g, note: note.trim(), photoUrl: photo, showName });
    setBusy(false);
    setDone(created);
    setPhoto("");
    setGrams("");
    setNote("");
    onDone?.();
  };

  if (done) {
    return (
      <div className="bg-paper p-5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-sub">submitted · pending validation</p>
        <p className="mt-2 text-[17px] text-ink">{done.refId} is with the {me?.floorCode} Floor Champion.</p>
        <p className="mt-1 text-[13px] leading-relaxed text-sub">
          Points are added to your floor the moment it is validated, and the leaderboard updates immediately.
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
          <span className="block text-[12px] text-sub">photo, grams reused and a short note · within 14 days of collecting</span>
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
            onChange={(e) => setGrams(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="150"
            className="mt-1 h-11 w-full border border-rule bg-white px-3 text-[13px] tabular outline-none focus:border-ink"
          />
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
        show my name (off by default — posts appear as {me?.floorCode} colleague)
      </label>

      {error && <p className="text-[12px] text-[#A44A3F]">{error}</p>}
      <Pill type="submit" disabled={busy}>{busy ? "submitting…" : "submit reuse record"}</Pill>
    </form>
  );
}
import { useMemo, useState } from "react";
import { FLOORS, timeAgo } from "@/lib/programme";
import { useProgramme } from "@/lib/programmeData";

export default function FloorStories({ onOpenPost }) {
  const { reuses } = useProgramme();
  const [viewer, setViewer] = useState(null);

  const stories = useMemo(
    () =>
      FLOORS.map((f) => {
        const latest = reuses
          .filter((r) => r.floorCode === f.code && r.status === "validated" && r.photoUrl)
          .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))[0];
        const recent = latest ? Date.now() - new Date(latest.occurredAt).getTime() < 24 * 3600000 : false;
        return { ...f, post: latest, recent };
      }),
    [reuses]
  );

  const open = stories.find((s) => s.code === viewer);

  return (
    <>
      <div className="flex items-start gap-4 overflow-x-auto pb-2 no-scrollbar">
        {stories.map((s) => (
          <button
            key={s.code}
            type="button"
            onClick={() => s.post && setViewer(s.code)}
            className="group flex w-[84px] shrink-0 flex-col items-center gap-1.5"
          >
            <span
              className={`flex h-[68px] w-[68px] items-center justify-center rounded-full p-[2px] ${
                s.recent ? "bg-caramel" : "bg-rule"
              }`}
            >
              <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-canvas">
                {s.post ? (
                  <img
                    src={s.post.photoUrl}
                    alt={`${s.code} latest reuse`}
                    className="h-full w-full rounded-full object-cover grayscale-[35%] transition-all duration-[400ms] group-hover:grayscale-0"
                  />
                ) : (
                  <span className="text-[10px] uppercase tracking-[0.1em] text-sub">empty</span>
                )}
              </span>
            </span>
            <span className="text-[11px] uppercase tracking-[0.1em] text-sub group-hover:text-ink">{s.code}</span>
          </button>
        ))}
      </div>

      {open && open.post && (
        <div className="fixed inset-0 z-40 flex flex-col bg-ink/95 px-4 py-6">
          <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.14em] text-white/70">
            <span>{open.code} · {open.name} · {timeAgo(open.post.occurredAt)}</span>
            <button type="button" onClick={() => setViewer(null)} className="text-white hover:text-caramel">
              close ✕
            </button>
          </div>
          <div className="mt-4 flex flex-1 items-center justify-center">
            <img src={open.post.photoUrl} alt={`${open.code} reuse`} className="max-h-[70vh] w-auto max-w-full object-contain" />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const i = stories.findIndex((s) => s.code === open.code);
                const prev = stories[(i - 1 + stories.length) % stories.length];
                if (prev.post) setViewer(prev.code);
              }}
              className="rounded-full border border-white/30 px-4 py-2 text-[12px] text-white hover:border-caramel hover:text-caramel"
            >
              ← previous floor
            </button>
            <button
              type="button"
              onClick={() => {
                setViewer(null);
                onOpenPost?.(open.post);
              }}
              className="rounded-full bg-white px-4 py-2 text-[12px] text-ink hover:bg-caramel hover:text-white"
            >
              open record {open.post.refId}
            </button>
            <button
              type="button"
              onClick={() => {
                const i = stories.findIndex((s) => s.code === open.code);
                const next = stories[(i + 1) % stories.length];
                if (next.post) setViewer(next.code);
              }}
              className="rounded-full border border-white/30 px-4 py-2 text-[12px] text-white hover:border-caramel hover:text-caramel"
            >
              next floor →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
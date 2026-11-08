import { useState } from "react";
import { activityByKey, timeAgo } from "@/lib/programme";
import { useProgramme } from "@/lib/programmeData";
import StatusChip from "./StatusChip";

export default function PostCard({ reuse, onOpen }) {
  const { comments, me, toggleReaction, reviewReuse } = useProgramme();
  const [mine, setMine] = useState({});
  const activity = activityByKey(reuse.activityKey);
  const counts = reuse.reactions || { appreciate: 0, trying: 0, impressive: 0 };
  const postComments = comments
    .filter((c) => c.reuseRefId === reuse.refId)
    .sort((a, b) => (a.occurredAt > b.occurredAt ? 1 : -1));
  const canReview = me?.role === "champion" && reuse.floorCode === me.floorCode && reuse.status === "pending";

  return (
    <article className="bg-paper transition-transform duration-200 hover:-translate-y-[2px]">
      <button type="button" onClick={() => onOpen(reuse)} className="block w-full text-left">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#D6D2CD]">
          {reuse.photoUrl ? (
            <img
              src={reuse.photoUrl}
              alt={`${activity.name} reuse on ${reuse.floorCode}`}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.14em] text-sub">
              no photo
            </div>
          )}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <StatusChip status={reuse.status} className="bg-white/90">
              {reuse.status === "pending" ? "pending validation" : reuse.status}
            </StatusChip>
          </div>
          <div className="absolute bottom-3 left-3 text-[11px] uppercase tracking-[0.14em] text-white">
            <span className="bg-ink/70 px-2 py-1">{reuse.floorCode} · {activity.name}</span>
          </div>
        </div>
      </button>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[13px] text-ink">
              {reuse.showName ? reuse.employeeName : `${reuse.floorCode} colleague`}
            </p>
            <p className="text-[11px] uppercase tracking-[0.12em] text-sub">
              {reuse.grams} g reused · {timeAgo(reuse.occurredAt)}
            </p>
          </div>
          <span className="text-[11px] tabular text-sub">{reuse.refId}</span>
        </div>

        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink">{reuse.note}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {[
            { key: "appreciate", label: "appreciate" },
            { key: "trying", label: "trying" },
            { key: "impressive", label: "impressive" },
          ].map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => {
                setMine((m) => ({ ...m, [r.key]: !m[r.key] }));
                toggleReaction(reuse, r.key);
              }}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                mine[r.key] ? "border-caramel bg-caramel/10 text-caramel" : "border-rule text-sub hover:border-ink hover:text-ink"
              }`}
            >
              {r.label} <span className="tabular">{counts[r.key] || 0}</span>
            </button>
          ))}
          <button type="button" onClick={() => onOpen(reuse)} className="ml-auto text-[11px] text-sub hover:text-ink">
            {reuse.commentCount || 0} comments
          </button>
        </div>

        {postComments.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t border-rule pt-3">
            {postComments.slice(-2).map((c) => (
              <li key={c.id} className="text-[12px] leading-relaxed">
                <span className="uppercase tracking-[0.1em] text-sub">{c.floorCode} colleague</span>{" "}
                <span className="text-ink">{c.body}</span>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => onOpen(reuse)} className="text-[11px] text-sub underline decoration-rule underline-offset-4 hover:text-ink">
                view all comments
              </button>
            </li>
          </ul>
        )}

        {canReview && (
          <div className="mt-3 flex gap-2 border-t border-dashed border-rule pt-3">
            <button
              type="button"
              onClick={() => reviewReuse(reuse, "validated")}
              className="rounded-full bg-ink px-3 py-1.5 text-[11px] text-white transition-colors hover:bg-verdant"
            >
              validate
            </button>
            <button
              type="button"
              onClick={() => onOpen(reuse)}
              className="rounded-full border border-rule px-3 py-1.5 text-[11px] text-sub transition-colors hover:border-ink hover:text-ink"
            >
              reject with reason
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
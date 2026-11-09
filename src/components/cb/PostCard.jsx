import { useState } from "react";
import { activityByKey, timeAgo } from "@/lib/programme";
import { useProgramme } from "@/lib/programmeData";
import { cropFor } from "@/lib/photoCrop";
import { authorLabel, avatarInitials } from "@/lib/people";
import StatusChip from "./StatusChip";
import CountUp from "./CountUp";
import MentionText from "./MentionText";

const KIND_LABEL = {
  tip: "tip · no photo",
  question: "question to the other floors",
  progress: "progress · day 1 to day 10",
};

export default function PostCard({ reuse, onOpen }) {
  const { comments, me, toggleReaction, reviewReuse } = useProgramme();
  const [mine, setMine] = useState({});
  const activity = activityByKey(reuse.activityKey);
  const counts = reuse.reactions || { appreciate: 0, trying: 0, impressive: 0 };
  const postComments = comments
    .filter((c) => c.reuseRefId === reuse.refId)
    .sort((a, b) => (a.occurredAt > b.occurredAt ? 1 : -1));
  const roots = postComments.filter((c) => !c.parentId).slice(-2);
  const canReview = me?.role === "champion" && reuse.floorCode === me.floorCode && reuse.status === "pending";
  const kindLabel = KIND_LABEL[reuse.kind] || (reuse.grams ? `${reuse.grams} g reused` : "no photo");

  return (
    <article className="bg-paper transition-transform duration-200 hover:-translate-y-[2px]">
      <button type="button" onClick={() => onOpen(reuse)} className="block w-full text-left">
        {reuse.photoUrl ? (
          <div className="group relative aspect-[4/5] overflow-hidden bg-[#D6D2CD]">
            <img
              src={reuse.photoUrl}
              alt={`${activity.name} reuse on ${reuse.floorCode}`}
              style={{ objectPosition: cropFor(reuse.refId).style.objectPosition }}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <StatusChip status={reuse.status} className="bg-white/90">
                {reuse.status === "pending" ? "pending validation" : reuse.status}
              </StatusChip>
            </div>
            <div className="pointer-events-none absolute bottom-3 left-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="bg-ink/80 px-2 py-1 text-[10.5px] uppercase tracking-[0.14em] text-white">
                {reuse.floorCode} · {activity.name}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative flex min-h-[132px] flex-col justify-between border-b border-rule bg-[#F1EEEA] p-4">
            <span className="text-[10px] uppercase tracking-[0.14em] text-sub">{reuse.floorCode} · {kindLabel}</span>
            <p className="mt-3 text-[14px] leading-relaxed text-ink">{reuse.note}</p>
          </div>
        )}
      </button>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {reuse.showName && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DFDBD6] text-[10px] uppercase tracking-[0.06em] text-ink">
                {avatarInitials(reuse.employeeName)}
              </span>
            )}
            <div>
              <p className="text-[13px] text-ink">{authorLabel(reuse)}</p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-sub">
                {kindLabel} · {timeAgo(reuse.occurredAt)}
              </p>
            </div>
          </div>
          <span className="text-[11px] tabular text-sub">{reuse.refId}</span>
        </div>

        {reuse.photoUrl && <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink">{reuse.note}</p>}

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
              {r.label} <CountUp value={counts[r.key] || 0} duration={500} />
            </button>
          ))}
          <button type="button" onClick={() => onOpen(reuse)} className="ml-auto text-[11px] text-sub hover:text-ink">
            {reuse.commentCount || 0} comments
          </button>
        </div>

        {roots.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t border-rule pt-3">
            {roots.map((c) => (
              <li key={c.id} className="text-[12px] leading-relaxed">
                <span className="uppercase tracking-[0.1em] text-sub">
                  {c.employeeName && c.floorCode ? `${c.floorCode} champion` : `${c.floorCode} colleague`}
                </span>{" "}
                <MentionText text={c.body} className="text-ink" />
                {postComments
                  .filter((r) => r.parentId === c.id)
                  .slice(-1)
                  .map((r) => (
                    <span key={r.id} className="mt-1 block border-l border-rule pl-2 text-[11.5px] text-sub">
                      <span className="uppercase tracking-[0.1em]">{r.floorCode} colleague</span>{" "}
                      <MentionText text={r.body} />
                    </span>
                  ))}
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
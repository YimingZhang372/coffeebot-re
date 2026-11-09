import { useEffect, useMemo, useState } from "react";
import { activityByKey, formatSgt, timeAgo } from "@/lib/programme";
import { useProgramme } from "@/lib/programmeData";
import { authorLabel } from "@/lib/people";
import Barcode from "./Barcode";
import StatusChip from "./StatusChip";
import PhotoUpload from "./PhotoUpload";
import Pill from "./Pill";
import CountUp from "./CountUp";
import MentionText from "./MentionText";
import ImpactLine from "./ImpactLine";

const REACTIONS = [
  { key: "appreciate", label: "appreciate" },
  { key: "trying", label: "trying this" },
  { key: "impressive", label: "impressive" },
];

/** Straight, centred post modal: photo left, scrollable detail right, comment box pinned. */
export default function PostModal({ reuse, onClose }) {
  const { me, comments, toggleReaction, addComment, saveActivity, addProgressUpdate, reviewReuse } = useProgramme();
  const [mine, setMine] = useState({});
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updatePhoto, setUpdatePhoto] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);

  const post = reuse;
  const activity = activityByKey(post.activityKey);
  const counts = post.reactions || { appreciate: 0, trying: 0, impressive: 0 };
  const isMine = post.employeeEmail === me?.email;
  const canReview = me?.role === "champion" && post.floorCode === me.floorCode;

  const thread = useMemo(
    () =>
      comments
        .filter((c) => c.reuseRefId === post.refId)
        .sort((a, b) => (a.occurredAt > b.occurredAt ? 1 : -1)),
    [comments, post.refId]
  );
  const roots = thread.filter((c) => !c.parentId);
  const reactedFloors = (post.reactedFloors || []).length
    ? (post.reactedFloors || []).length === 1
      ? `${post.reactedFloors[0]} appreciated this`
      : `${post.reactedFloors[0]} and ${(post.reactedFloors || []).length - 1} other floors reacted`
    : "";

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await addComment(post, body.trim(), replyTo);
      setBody("");
      setReplyTo("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-ink/70 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${activity.name} reuse record ${post.refId}`}
        onClick={(e) => e.stopPropagation()}
        className="grid h-[100dvh] w-full grid-cols-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-white md:h-[85vh] md:max-h-[85vh] md:max-w-[1100px] md:grid-cols-[55%_45%] md:grid-rows-1 md:rounded-[2px]"
      >
        <div className="relative h-[45vh] max-h-[45vh] w-full overflow-hidden bg-[#D6D2CD] md:h-full md:max-h-none">
          {post.photoUrl ? (
            <img
              src={post.photoUrl}
              alt={`${activity.name} reuse on ${post.floorCode}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-6 text-center text-[11px] uppercase tracking-[0.14em] text-sub">
              {post.kind === "question" ? "question to the other floors" : post.kind === "tip" ? "tip · no photo" : "no photo attached"}
            </div>
          )}
        </div>

        <div className="flex min-h-0 min-w-0 flex-col md:h-full">
          <div className="flex items-center justify-between gap-3 border-b border-rule px-8 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={post.status}>
                {post.status === "pending" ? "pending validation" : post.status}
              </StatusChip>
              <span className="text-[10.5px] uppercase tracking-[0.12em] text-sub">
                {post.floorCode} · {post.office}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-rule text-[13px] text-sub transition-colors hover:border-ink hover:text-ink"
            >
              ✕
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
            <p className="text-[11px] uppercase tracking-[0.14em] text-sub">
              {activity.name}
              {post.grams ? ` · ${post.grams} g reused` : ""}
            </p>
            {post.grams ? (
              <ImpactLine grams={post.grams} scope="personal" className="mt-1" />
            ) : null}

            <p className="mt-3 text-[15px] leading-relaxed text-ink">{post.note}</p>

            <p className="mt-3 text-[12px] text-sub">
              {authorLabel(post)} · {timeAgo(post.occurredAt)} · {formatSgt(post.occurredAt)}
            </p>

            {post.status === "rejected" && post.rejectionReason && (
              <p className="mt-3 border-l-2 border-[#A44A3F] pl-3 text-[12px] text-[#A44A3F]">{post.rejectionReason}</p>
            )}

            {post.progressUpdates?.length > 0 && (
              <div className="mt-4 border-t border-dashed border-rule pt-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-sub">progress</p>
                <ul className="mt-2 space-y-2">
                  {post.progressUpdates.map((u, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <img src={u.photoUrl} alt="" className="h-10 w-10 rounded-[2px] object-cover" />
                      <span className="text-[12px] text-ink">{u.note}</span>
                      <span className="ml-auto text-[11px] text-sub">{formatSgt(u.date, false)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5">
              {REACTIONS.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => {
                    setMine((m) => ({ ...m, [r.key]: !m[r.key] }));
                    toggleReaction(post, r.key);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                    mine[r.key]
                      ? "border-caramel bg-caramel/10 text-caramel"
                      : "border-rule text-sub hover:border-ink hover:text-ink"
                  }`}
                >
                  {r.label} <CountUp value={counts[r.key] || 0} duration={500} />
                </button>
              ))}
            </div>
            {reactedFloors && <p className="mt-1.5 text-[11px] text-sub">{reactedFloors}</p>}

            <div className="mt-4 flex flex-wrap gap-2 border-t border-rule pt-3">
              <Pill
                size="sm"
                variant="outline"
                onClick={() => {
                  saveActivity(post.activityKey, post.refId);
                  setNotice("Saved to my activities.");
                }}
              >
                try this
              </Pill>
              <Pill size="sm" variant="outline" onClick={() => setNotice("Shared to your floor.")}>
                share to my floor
              </Pill>
              <Pill size="sm" variant="ghost" onClick={() => setNotice("Reported to the programme administrator.")}>
                report
              </Pill>
              {isMine && (
                <Pill size="sm" variant="ghost" onClick={() => setUpdateOpen((v) => !v)}>
                  add update
                </Pill>
              )}
            </div>
            {notice && <p className="mt-2 text-[12px] text-verdant">{notice}</p>}

            {updateOpen && (
              <div className="mt-3 space-y-2 border border-rule p-3">
                <PhotoUpload
                  value={updatePhoto}
                  onChange={setUpdatePhoto}
                  visibility="public"
                  label="add a dated photo"
                  hint="same post, later stage"
                />
                <input
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="day 10 — first flush"
                  className="h-10 w-full border border-rule bg-white px-3 text-[13px] outline-none focus:border-ink"
                />
                <Pill
                  size="sm"
                  disabled={!updatePhoto}
                  onClick={async () => {
                    await addProgressUpdate(post, { photoUrl: updatePhoto, note: updateNote || "progress update" });
                    setUpdateOpen(false);
                    setUpdatePhoto("");
                    setUpdateNote("");
                    setNotice("Progress update added.");
                  }}
                >
                  add to timeline
                </Pill>
              </div>
            )}

            {canReview && post.status === "pending" && (
              <div className="mt-4 border-t border-dashed border-rule pt-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-sub">champion review · {post.floorCode}</p>
                {!rejecting ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Pill size="sm" onClick={() => reviewReuse(post, "validated")}>validate</Pill>
                    <Pill size="sm" variant="outline" onClick={() => setRejecting(true)}>reject</Pill>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason (required, sent to the author)"
                      className="h-10 w-full border border-rule bg-white px-3 text-[13px] outline-none focus:border-ink"
                    />
                    <div className="flex gap-2">
                      <Pill
                        size="sm"
                        disabled={reason.trim().length < 5}
                        onClick={async () => {
                          await reviewReuse(post, "rejected", reason.trim());
                          setRejecting(false);
                        }}
                      >
                        confirm rejection
                      </Pill>
                      <Pill size="sm" variant="ghost" onClick={() => setRejecting(false)}>cancel</Pill>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 border-t border-rule pt-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-sub">{thread.length} comments</p>
              <ul className="mt-2 space-y-3">
                {roots.map((c) => {
                  const replies = thread.filter((r) => r.parentId === c.id);
                  return (
                    <li key={c.id}>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-[10.5px] uppercase tracking-[0.1em] text-sub">
                          {c.floorCode} colleague
                        </span>
                        <MentionText text={c.body} className="text-[12.5px] leading-relaxed text-ink" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyTo(c.id)}
                        className="mt-1 text-[11px] text-sub hover:text-ink"
                      >
                        reply
                      </button>
                      {replies.length > 0 && (
                        <ul className="mt-2 space-y-2 border-l border-rule pl-3">
                          {replies.map((r) => (
                            <li key={r.id} className="flex items-start gap-2">
                              <span className="mt-0.5 shrink-0 text-[10.5px] uppercase tracking-[0.1em] text-sub">
                                {r.floorCode} colleague
                              </span>
                              <MentionText text={r.body} className="text-[12.5px] leading-relaxed text-ink" />
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
                {!thread.length && (
                  <li className="text-[12.5px] text-sub">No comments yet. Reply as {me?.floorCode} colleague.</li>
                )}
              </ul>
            </div>
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-rule px-8 py-3">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={replyTo ? "replying…" : `comment as ${me?.floorCode} colleague · @L11 notifies that floor`}
              maxLength={280}
              className="h-10 min-w-0 flex-1 rounded-full border border-rule bg-white px-4 text-[13px] outline-none focus:border-ink"
            />
            <Pill type="submit" size="sm" disabled={!body.trim() || sending}>post</Pill>
          </form>

          <div className="flex items-center gap-3 border-t border-rule bg-[#F7F5F3] px-8 py-2">
            <Barcode value={post.refId} height={18} showValue={false} className="w-[64px] shrink-0" />
            <span className="text-[9.5px] uppercase tracking-[0.14em] text-sub">record {post.refId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
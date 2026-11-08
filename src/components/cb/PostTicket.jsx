import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { activityByKey, formatSgt, timeAgo } from "@/lib/programme";
import { useProgramme } from "@/lib/programmeData";
import Barcode from "./Barcode";
import StatusChip from "./StatusChip";
import PhotoUpload from "./PhotoUpload";
import Pill from "./Pill";

const REACTIONS = [
  { key: "appreciate", label: "appreciate" },
  { key: "trying", label: "trying this" },
  { key: "impressive", label: "impressive" },
];

export default function PostTicket({ reuse, onClose }) {
  const { me, comments, reactions, toggleReaction, addComment, saveActivity, addProgressUpdate, reviewReuse } =
    useProgramme();
  const [mine, setMine] = useState({});
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updatePhoto, setUpdatePhoto] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [notice, setNotice] = useState("");
  const reduce = useReducedMotion();

  const post = reuse;
  const activity = activityByKey(post.activityKey);
  const postComments = comments
    .filter((c) => c.reuseRefId === post.refId)
    .sort((a, b) => (a.occurredAt > b.occurredAt ? 1 : -1));
  const roots = postComments.filter((c) => !c.parentId);
  const counts = post.reactions || { appreciate: 0, trying: 0, impressive: 0 };
  const isMine = post.employeeEmail === me?.email;
  const canReview = me?.role === "champion" && post.floorCode === me.floorCode;
  const photo = post.photoUrl;

  const reactedFloors = useMemo(() => {
    const list = post.reactedFloors || [];
    if (!list.length) return "";
    if (list.length === 1) return `${list[0]} appreciated this`;
    return `${list[0]} and ${list.length - 1} other floors reacted`;
  }, [post.reactedFloors]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    await addComment(post, body.trim(), replyTo);
    setBody("");
    setReplyTo("");
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-ink/45 px-4 py-8 backdrop-blur-sm">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24, rotate: 1 }}
        animate={{ opacity: 1, y: 0, rotate: -1.6 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className="mx-auto flex w-full max-w-[940px] overflow-hidden bg-paper shadow-[0_40px_90px_-40px_rgba(20,20,20,0.6)]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between border-b border-rule px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] tabular text-sub">{post.refId}</span>
              <StatusChip status={post.status}>
                {post.status === "pending" ? "pending validation" : post.status}
              </StatusChip>
              <span className="text-[11px] uppercase tracking-[0.12em] text-sub">
                {post.floorCode} · {post.office}
              </span>
            </div>
            <button type="button" onClick={onClose} className="text-[13px] text-sub hover:text-ink">
              close ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1.05fr_1fr]">
            <div className="bg-[#D6D2CD]">
              {photo ? (
                <img src={photo} alt={`${activity.name} reuse`} className="h-full max-h-[420px] w-full object-cover" />
              ) : (
                <div className="flex h-[240px] items-center justify-center text-[12px] uppercase tracking-[0.14em] text-sub">
                  no photo attached
                </div>
              )}
            </div>
            <div className="p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sub">
                {activity.name} · {post.grams} g reused
              </p>
              <h2 className="mt-2 text-[19px] leading-snug text-ink">{post.note}</h2>
              <p className="mt-2 text-[12px] text-sub">
                {post.showName ? post.employeeName : `${post.floorCode} colleague`} · {timeAgo(post.occurredAt)} ·{" "}
                {formatSgt(post.occurredAt)}
              </p>
              {post.inspiredByRef && (
                <p className="mt-2 text-[12px] text-sub">
                  Inspired by a post from{" "}
                  <span className="text-ink">{post.inspiredByRef.slice(-3) ? post.inspiredByRef : ""}</span>
                </p>
              )}
              {post.status === "rejected" && post.rejectionReason && (
                <p className="mt-3 border-l-2 border-[#A44A3F] pl-3 text-[12px] text-[#A44A3F]">
                  {post.rejectionReason}
                </p>
              )}

              {post.progressUpdates?.length > 0 && (
                <div className="mt-4 border-t border-dashed border-rule pt-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-sub">progress</p>
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
                      mine[r.key] ? "border-caramel bg-caramel/10 text-caramel" : "border-rule text-sub hover:border-ink hover:text-ink"
                    }`}
                  >
                    {r.label} <span className="tabular">{counts[r.key] || 0}</span>
                  </button>
                ))}
              </div>
              {reactedFloors && <p className="mt-2 text-[11px] text-sub">{reactedFloors}</p>}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-rule pt-3">
                <Pill size="sm" variant="outline" onClick={() => { saveActivity(post.activityKey, post.refId); setNotice("Saved to my activities."); }}>
                  try this
                </Pill>
                <Pill size="sm" variant="outline" onClick={() => setNotice("Shared with your floor.")}>
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
                  <p className="text-[11px] uppercase tracking-[0.14em] text-sub">champion review · {post.floorCode}</p>
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
            </div>
          </div>

          <div className="border-t border-rule px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-sub">{postComments.length} comments</p>
            <ul className="mt-3 space-y-3">
              {roots.map((c) => {
                const replies = postComments.filter((r) => r.parentId === c.id);
                return (
                  <li key={c.id}>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-sub">{c.floorCode} colleague</span>
                      <p className="text-[13px] leading-relaxed text-ink">{c.body}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyTo(c.id)}
                      className="mt-1 text-[11px] text-sub hover:text-ink"
                    >
                      reply
                    </button>
                    <ul className="mt-2 space-y-2 border-l border-rule pl-3">
                      {replies.map((r) => (
                        <li key={r.id} className="flex items-start gap-2">
                          <span className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-sub">{r.floorCode} colleague</span>
                          <p className="text-[13px] leading-relaxed text-ink">{r.body}</p>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
              {!postComments.length && (
                <li className="text-[13px] text-sub">No comments yet. Reply as {me?.floorCode} colleague.</li>
              )}
            </ul>

            <form onSubmit={submitComment} className="mt-4 flex flex-wrap items-center gap-2">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={replyTo ? "replying…" : `comment as ${me?.floorCode} colleague · use @L11 to notify that floor's champion`}
                maxLength={280}
                className="h-11 flex-1 min-w-[240px] rounded-full border border-rule bg-white px-4 text-[13px] outline-none focus:border-ink"
              />
              <Pill type="submit" size="sm" disabled={!body.trim()}>post comment</Pill>
            </form>
          </div>
        </div>

        <div className="hidden w-[86px] shrink-0 flex-col items-center justify-between border-l border-dashed border-rule bg-[#F7F5F3] px-3 py-5 sm:flex">
          <div className="h-[1px] w-full bg-rule" />
          <Barcode value={post.refId} height={150} className="rotate-90" showValue={false} />
          <div className="text-center text-[8px] uppercase leading-relaxed tracking-[0.14em] text-sub">
            record
            <br />
            {post.refId}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useProgramme } from "@/lib/programmeData";
import { ACTIVITIES, FLOORS, activityByKey } from "@/lib/programme";
import { publicNudges } from "@/lib/metrics";
import { monthLabel, formatSgt } from "@/lib/programme";
import Composer from "@/components/cb/Composer";
import PostCard from "@/components/cb/PostCard";
import PostTicket from "@/components/cb/PostTicket";
import FloorStories from "@/components/cb/FloorStories";
import ChallengePanel from "@/components/cb/ChallengePanel";
import EmptyState from "@/components/cb/EmptyState";
import NudgeList from "@/components/cb/NudgeList";
import Pill from "@/components/cb/Pill";
import Marquee from "@/components/cb/Marquee";
import WelcomeCard from "@/components/cb/WelcomeCard";
import ChampionCard from "@/components/cb/ChampionCard";
import { marqueeItems } from "@/lib/metrics";

const TABS = ["Feed", "Gallery", "Challenges"];

export default function Community() {
  const { me, reuses, rows, myRow, month, challenges, nudgeFloor } = useProgramme();
  const [nudge, setNudge] = useState("");
  const nudgeBlocked =
    me?.lastNudgeAt && Date.now() - new Date(me.lastNudgeAt).getTime() < 7 * 86400000;
  const [tab, setTab] = useState("Feed");
  const [scope, setScope] = useState("floor");
  const [activity, setActivity] = useState("");
  const [validatedOnly, setValidatedOnly] = useState(false);
  const [sort, setSort] = useState("latest");
  const [openPost, setOpenPost] = useState(null);
  const [galleryFloor, setGalleryFloor] = useState("");
  const [composer, setComposer] = useState({ key: 0, open: false, prefill: "" });
  const reduce = useReducedMotion();

  const openComposer = (prefill = "") => {
    setComposer((c) => ({ key: c.key + 1, open: true, prefill }));
    requestAnimationFrame(() => {
      document.getElementById("composer-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const monthReuses = useMemo(
    () => reuses.filter((r) => r.occurredAt.slice(0, 7) === month),
    [reuses, month]
  );

  const feed = useMemo(() => {
    let list = reuses.filter((r) => r.status !== "rejected");
    if (scope === "floor") list = list.filter((r) => r.floorCode === me?.floorCode);
    if (activity) list = list.filter((r) => r.activityKey === activity);
    if (validatedOnly) list = list.filter((r) => r.status === "validated");
    list = list.slice().sort((a, b) => {
      if (sort === "liked") {
        const score = (x) => (x.reactions?.appreciate || 0) + (x.reactions?.trying || 0) + (x.reactions?.impressive || 0);
        return score(b) - score(a);
      }
      return a.occurredAt < b.occurredAt ? 1 : -1;
    });
    return list;
  }, [reuses, scope, activity, validatedOnly, sort, me]);

  const queue = reuses.filter(
    (r) => r.status === "pending" && r.floorCode === me?.floorCode && me?.role === "champion"
  );

  const validatedThisYear = reuses.filter((r) => r.status === "validated").length;
  const gallery = reuses
    .filter((r) => r.status === "validated" && r.photoUrl)
    .filter((r) => (galleryFloor ? r.floorCode === galleryFloor : true))
    .filter((r) => (activity ? r.activityKey === activity : true))
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));

  const trending = Object.entries(
    monthReuses.filter((r) => r.status === "validated").reduce((acc, r) => {
      acc[r.activityKey] = (acc[r.activityKey] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const weekAgo = Date.now() - 7 * 86400000;
  const weeklyCollectors = useMemo(() => {
    const set = new Set(
      reuses
        .filter((r) => r.floorCode === me?.floorCode && new Date(r.occurredAt).getTime() > weekAgo && r.status === "validated")
        .map((r) => r.employeeName)
    );
    return [...set].slice(0, 8);
  }, [reuses, me, weekAgo]);

  const lastFloorPost = reuses
    .filter((r) => r.floorCode === me?.floorCode && r.status === "validated")
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))[0];

  const activeChallenge = challenges.find((c) => c.status === "active");
  const marquee = marqueeItems({ rows, myRow, nextDropLabel: "tue 10 nov · 10:00", challenge: activeChallenge });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-sub">community · {monthLabel(month)}</p>
          <h1 className="display mt-3 text-[54px] sm:text-[88px]">community.</h1>
        </div>
        <p className="max-w-[42ch] text-[13px] leading-relaxed text-sub">
          {reuses.filter((r) => r.status === "validated").length} reuses reported by colleagues across six floors.
          Posts appear as a floor by default; names are opt-in per post. Proof photos never appear here.
        </p>
      </div>

      <WelcomeCard onShare={() => openComposer("")} />

      <Marquee items={marquee} className="-mx-5 sm:-mx-8" speed={58} />

      <FloorStories onOpenPost={setOpenPost} />

      <div className="flex flex-wrap items-center gap-6 border-b border-rule">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative pb-3 text-[15px] lowercase transition-colors ${
              tab === t ? "text-ink" : "text-sub hover:text-ink"
            }`}
          >
            {t}
            {tab === t && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-caramel" />}
          </button>
        ))}
        <span className="ml-auto pb-3 text-[11px] uppercase tracking-[0.14em] text-sub">
          {validatedThisYear} validated reuses this year
        </span>
      </div>

      {tab === "Feed" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
          <aside className="space-y-5">
            <div className="bg-paper p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sub">my floor</p>
              <p className="display mt-1 text-[30px]">{myRow?.code}</p>
              <p className="text-[12px] text-sub">{Math.round(myRow?.perEmployee || 0)} g per employee</p>
              <div className="mt-3 h-[3px] w-full bg-rule">
                <span className="block h-[3px] bg-caramel" style={{ width: `${Math.min(100, ((myRow?.participation || 0) / (myRow?.target || 30)) * 100)}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-sub">
                {Math.round(myRow?.participation || 0)}% participation · target {myRow?.target || 30}%
              </p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-sub">collected this week</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {weeklyCollectors.length ? (
                  weeklyCollectors.map((n, i) => (
                    <span
                      key={i}
                      title="colleague on your floor"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DFDBD6] text-[10px] text-sub"
                    >
                      {n.split(" ").slice(0, 2).map((p) => p[0]).join("")}
                    </span>
                  ))
                ) : (
                  <span className="text-[12px] text-sub">
                    {lastFloorPost
                      ? `No reuse yet this week. Last activity ${formatSgt(lastFloorPost.occurredAt, false)}.`
                      : "No activity on your floor yet."}
                  </span>
                )}
              </div>
              {me?.role === "champion" && (
                <div className="mt-4 border-t border-rule pt-3">
                  <button
                    type="button"
                    disabled={nudgeBlocked}
                    onClick={async () => {
                      const res = await nudgeFloor();
                      setNudge(
                        res.blocked
                          ? "A reminder was already sent this week."
                          : `Reminder sent to ${res.sent} colleagues who have not participated this month.`
                      );
                    }}
                    className="w-full rounded-full border-[1.5px] border-ink px-3 py-2 text-[12px] lowercase transition-colors hover:border-caramel hover:text-caramel disabled:opacity-40"
                  >
                    nudge my floor
                  </button>
                  <p className="mt-1.5 text-[10px] uppercase leading-relaxed tracking-[0.1em] text-sub">
                    {nudge || (nudgeBlocked ? "sent this week · next available in 7 days" : "once a week · simulated email and notification")}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="border-b border-rule pb-2 text-[11px] uppercase tracking-[0.14em] text-sub">floor race</p>
              <ul className="mt-2 space-y-1.5">
                {rows.map((r) => {
                  const above = rows[r.rank - 2];
                  return (
                    <li key={r.code} className="text-[12px]">
                      <div className="flex items-baseline justify-between">
                        <span className={r.code === me?.floorCode ? "text-caramel" : "text-ink"}>
                          {String(r.rank).padStart(2, "0")} {r.code}
                        </span>
                        <span className="tabular text-sub">{Math.round(r.perEmployee)} g</span>
                      </div>
                      {r.code === me?.floorCode && above && (
                        <p className="text-[11px] text-sub">
                          {Math.max(1, Math.round(above.perEmployee - r.perEmployee))} g per employee behind {above.code}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          <div className="space-y-5">
            <div id="composer-card">
              <Composer key={composer.key} autoOpen={composer.open} prefill={composer.prefill} />
            </div>

            {queue.length > 0 && (
              <div className="border border-dashed border-caramel/60 bg-caramel/5 px-4 py-3">
                <p className="text-[12px] uppercase tracking-[0.12em] text-[#8F6539]">
                  {queue.length} post{queue.length > 1 ? "s" : ""} waiting for your validation
                </p>
                <p className="mt-1 text-[12px] text-sub">Validate or reject directly on the card. Rejection needs a reason.</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-full border border-rule">
                {[["floor", "my floor"], ["office", "whole office"]].map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setScope(k)}
                    className={`rounded-full px-3 py-1.5 text-[12px] lowercase transition-colors ${
                      scope === k ? "bg-ink text-white" : "text-sub hover:text-ink"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="h-9 border border-rule bg-white px-2 text-[12px] lowercase"
              >
                <option value="">all activities</option>
                {ACTIVITIES.map((a) => (
                  <option key={a.key} value={a.key}>{a.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setValidatedOnly((v) => !v)}
                className={`rounded-full border px-3 py-1.5 text-[12px] lowercase ${
                  validatedOnly ? "border-verdant text-verdant" : "border-rule text-sub hover:text-ink"
                }`}
              >
                validated only
              </button>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="ml-auto h-9 border border-rule bg-white px-2 text-[12px] lowercase"
              >
                <option value="latest">latest</option>
                <option value="liked">most liked</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {feed.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: (i % 2) * 0.04 }}
                >
                  <PostCard reuse={r} onOpen={setOpenPost} />
                </motion.div>
              ))}
            </div>

            {!feed.length && (
              <EmptyState
                title={scope === "floor" ? "No posts from your floor yet this month. Share your first reuse." : "No posts match these filters."}
                body="Adjust the filters, or share a reuse with a photo and the grams."
              />
            )}
          </div>

          <aside className="space-y-5">
            <div>
              <p className="border-b border-rule pb-2 text-[11px] uppercase tracking-[0.14em] text-sub">this month on your floor</p>
              <ul className="mt-2 space-y-1.5 text-[12px] text-sub">
                <li className="flex justify-between">
                  <span>posts validated</span>
                  <span className="tabular text-ink">{myRow?.posts || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span>kg reused</span>
                  <span className="tabular text-ink">{((myRow?.reused || 0) / 1000).toFixed(2)}</span>
                </li>
                <li className="flex justify-between">
                  <span>rank</span>
                  <span className="tabular text-ink">{myRow?.rank} of 6</span>
                </li>
              </ul>
            </div>

            <div className="bg-paper p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sub">pinned · beginner guide</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink">
                Wet grounds go straight into soil, compost or a mushroom kit. Dry them for two days before the
                fridge deodoriser or the soap bar.
              </p>
              <Pill to="/activities" size="sm" variant="outline" className="mt-3">open activities</Pill>
            </div>

            <div>
              <p className="border-b border-rule pb-2 text-[11px] uppercase tracking-[0.14em] text-sub">top activities this month</p>
              <ul className="mt-2 space-y-1.5">
                {trending.map(([key, count], i) => (
                  <li key={key} className="flex items-baseline justify-between text-[12px]">
                    <span className="text-ink">{String(i + 1).padStart(2, "0")} {activityByKey(key).name}</span>
                    <span className="tabular text-sub">{count}</span>
                  </li>
                ))}
                {!trending.length && <li className="text-[12px] text-sub">Nothing validated yet this month.</li>}
              </ul>
            </div>

            <ChampionCard onAsk={(floor) => openComposer(`@${floor} `)} />

            <NudgeList items={publicNudges({ rows, myRow, monthLabel: monthLabel(month), daysLeft: 22 }).slice(0, 2)} />
          </aside>
        </div>
      )}

      {tab === "Gallery" && (
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.14em] text-sub">
              made by harbourline · {validatedThisYear} reuses this year
            </span>
            <select value={galleryFloor} onChange={(e) => setGalleryFloor(e.target.value)} className="ml-auto h-9 border border-rule bg-white px-2 text-[12px] lowercase">
              <option value="">all floors</option>
              {FLOORS.map((f) => (
                <option key={f.code} value={f.code}>{f.code}</option>
              ))}
            </select>
            <select value={activity} onChange={(e) => setActivity(e.target.value)} className="h-9 border border-rule bg-white px-2 text-[12px] lowercase">
              <option value="">all activities</option>
              {ACTIVITIES.map((a) => (
                <option key={a.key} value={a.key}>{a.name}</option>
              ))}
            </select>
          </div>

          {gallery.length ? (
            <div className="mt-4 columns-2 gap-[6px] sm:columns-3 lg:columns-4">
              {gallery.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setOpenPost(r)}
                  className="group mb-[6px] block w-full overflow-hidden rounded-[2px] bg-[#D6D2CD]"
                >
                  <img
                    src={r.photoUrl}
                    alt={`${r.floorCode} ${activityByKey(r.activityKey).name}`}
                    className="w-full grayscale-[35%] opacity-90 transition-all duration-[400ms] group-hover:grayscale-0 group-hover:opacity-100"
                  />
                  <span className="block bg-paper px-2 py-1.5 text-left text-[10px] uppercase tracking-[0.1em] text-sub">
                    {r.floorCode} · {r.grams} g
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState title="No validated photos yet." body="Photos appear here once a Floor Champion validates a post." />
            </div>
          )}
        </div>
      )}

      {tab === "Challenges" && <ChallengePanel />}

      {openPost && <PostTicket reuse={openPost} onClose={() => setOpenPost(null)} />}
    </div>
  );
}
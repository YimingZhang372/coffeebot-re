import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useProgramme } from "@/lib/programmeData";
import { monthLabel, formatSgt, nowSgt } from "@/lib/programme";
import { publicNudges, marqueeItems } from "@/lib/metrics";
import { groundDropState, downloadIcs } from "@/lib/groundDrop";
import { shiftMonth } from "@/lib/pledge";
import CountUp from "@/components/cb/CountUp";
import Marquee from "@/components/cb/Marquee";
import Stepper from "@/components/cb/Stepper";
import RankingIndex, { RankingFooter } from "@/components/cb/RankingIndex";
import GroundDropCalendar from "@/components/cb/GroundDropCalendar";
import NudgeList from "@/components/cb/NudgeList";
import Pill from "@/components/cb/Pill";
import StatusChip from "@/components/cb/StatusChip";
import ImpactLine from "@/components/cb/ImpactLine";

const DROPS_PER_MONTH = 4;

export default function Home() {
  const {
    me, rows, office, myRow, settings, month, reuses, dropsDone,
    myCollections, myReuses, notifications, board, config,
  } = useProgramme();
  const reduce = useReducedMotion();

  const divertedKg = office.reused / 1000;
  const targetKg = settings?.monthlyTargetKg ?? 6;
  const projectedKg = dropsDone > 0 ? (divertedKg * DROPS_PER_MONTH) / dropsDone : divertedKg;
  const monthName = monthLabel(month);
  const st = groundDropState(settings);

  // Same point last month: the first N days, N = today's day of month, so 9 days are compared with 9 days.
  const dayCut = nowSgt().getUTCDate();
  const prevKey = shiftMonth(month, -1);
  const prevSamePoint = reuses
    .filter(
      (r) =>
        r.status === "validated" &&
        String(r.occurredAt).slice(0, 7) === prevKey &&
        Number(String(r.occurredAt).slice(8, 10)) <= dayCut
    )
    .reduce((s, r) => s + (r.grams || 0), 0);
  const samePointDelta = prevSamePoint ? ((office.reused - prevSamePoint) / prevSamePoint) * 100 : 0;

  const monthCollections = myCollections.filter((c) => String(c.occurredAt).slice(0, 7) === month);
  const monthReuses = myReuses.filter((r) => String(r.occurredAt).slice(0, 7) === month);
  const pending = monthReuses.find((r) => r.status === "pending");
  const validated = monthReuses.filter((r) => r.status === "validated");

  const step = monthCollections.length === 0 ? "collect" : monthReuses.length === 0 ? "share" : validated.length ? "score" : "share";

  const nextAction = (() => {
    if (!monthCollections.length)
      return {
        title: "Collect grounds",
        body: `The ${myRow?.code || "floor"} caddy is restocked on ${st.nextLabel} at ${st.time}. Weigh what you take at the table.`,
        to: "/collect",
        cta: "I took grounds",
      };
    if (pending)
      return {
        title: "Waiting for validation",
        body: `${pending.refId} is with the ${me?.floorCode} Floor Champion. Points land on your floor the moment it is validated.`,
        to: "/community",
        cta: "View record",
      };
    if (!monthReuses.length)
      return {
        title: "Share your reuse",
        body: "You have grounds at home. Report the grams reused with a photo within 14 days.",
        to: "/community",
        cta: "Share reuse",
      };
    return {
      title: "Try another activity",
      body: "Your record is validated. Add a progress update, or try one of the other activities.",
      to: "/activities",
      cta: "Open activities",
    };
  })();

  const nudges = publicNudges({ rows, myRow, monthLabel: monthName, daysLeft: 22 });
  const privateNudges = notifications
    .filter((n) => n.type === "nudge" || n.type === "validation")
    .slice(0, 2)
    .map((n) => n.body);
  const marquee = marqueeItems({ board, config, month });
  const myPledge = board.find((r) => r.code === me?.floorCode);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-sub">
            {monthName} · {me?.office || "Marina Bay"} · {me?.floorCode} {me?.department}
          </p>
          <h1 className="mt-3 max-w-[26ch] text-[26px] leading-[1.15] text-ink sm:text-[32px]">
            Turning Harbourline&rsquo;s coffee grounds into a measurable ESG result.
          </h1>
        </div>
        <div className="text-right text-[11px] uppercase leading-relaxed tracking-[0.14em] text-sub">
          last updated {formatSgt(new Date(), true)}
          <br />
          evidence weighed at collection
        </div>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="grid grid-cols-1 gap-8 border-y border-rule py-7 lg:grid-cols-[1.35fr_1fr] lg:items-end"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-sub">kg diverted from disposal</p>
          <div className="display mt-2 flex items-baseline gap-3 text-[clamp(64px,11vw,132px)]">
            <CountUp value={divertedKg} decimals={2} />
            <span className="text-[24px] lowercase tracking-normal sm:text-[32px]">kg</span>
          </div>
          <p className="mt-1 text-[13px] text-sub">
            {monthName} to date · {office.participants} of {office.eligible} employees participating
          </p>
          <p className="mt-1 text-[13px] text-sub">
            reuse rate{" "}
            <span className="tabular text-ink">{office.reuseRate.toFixed(0)}%</span> · {divertedKg.toFixed(2)} kg
            reused of <span className="tabular text-ink">{(office.collected / 1000).toFixed(2)} kg</span> collected
          </p>
          <ImpactLine grams={office.reused} scope="office" className="mt-1.5" />
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between text-[12px] text-sub">
              <span>office target · projection at this pace</span>
              <span className="tabular text-ink">
                {projectedKg.toFixed(1)} / {targetKg.toFixed(1)} kg
              </span>
            </div>
            <div className="mt-2 h-[3px] w-full bg-rule">
              <motion.div
                className={`h-[3px] ${projectedKg >= targetKg ? "bg-verdant" : "bg-caramel"}`}
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${Math.min(100, (projectedKg / targetKg) * 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-sub">
              {divertedKg.toFixed(2)} kg so far · {dropsDone} of {DROPS_PER_MONTH} Ground Drops held
            </p>
          </div>
          <div className="flex items-center gap-6 text-[12px] text-sub">
            <span>
              vs same point in {monthLabel(prevKey)}{" "}
              <span className={`tabular ${samePointDelta >= 0 ? "text-verdant" : "text-[#A44A3F]"}`}>
                {samePointDelta >= 0 ? "+" : ""}
                {samePointDelta.toFixed(0)}%
              </span>
            </span>
            <span>
              collected <span className="tabular text-ink">{(office.collected / 1000).toFixed(2)} kg</span>
            </span>
          </div>
          <p className="text-[12px] leading-relaxed text-sub">
            All figures derive from weighed collections and Champion-validated reuse records. GRI 306-4,
            preparation for reuse.
          </p>
        </div>
      </motion.div>

      <Stepper current={step} />

      <Marquee items={marquee} speed={52} className="-mx-5 sm:-mx-8" />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <div className="flex items-baseline justify-between border-b border-rule pb-3">
            <h2 className="text-[15px] lowercase">
              <span className="mr-2 text-sub tabular">01</span>this month&rsquo;s floor ranking
            </h2>
            <span className="text-[11px] uppercase tracking-[0.14em] text-sub">kg reused per employee</span>
          </div>
          <RankingIndex rows={rows} myFloor={me?.floorCode} />
          <RankingFooter />

          {myPledge && (
            <Link
              to="/pledge"
              className="mt-5 block bg-ink p-5 text-white transition-colors duration-200 hover:bg-caramel"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/55">
                  your floor&rsquo;s pledge · {myPledge.code}
                </p>
                <span className="text-[12px] lowercase text-white/60">open →</span>
              </div>
              <p className="display mt-2 text-[30px] leading-none">+{myPledge.bid}%</p>
              <p className="mt-2 text-[12.5px] text-white/75">
                {myPledge.paceMet ? "On track" : "Behind"} · projected {Math.round(myPledge.score)} · rank{" "}
                {myPledge.rank} of 6
              </p>
            </Link>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-paper p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] lowercase">
                <span className="mr-2 text-sub tabular">02</span>my next action
              </h2>
              <StatusChip status={pending ? "pending" : validated.length ? "validated" : "neutral"}>
                {pending ? "pending validation" : validated.length ? "validated" : "open"}
              </StatusChip>
            </div>
            <p className="mt-3 text-[17px] text-ink">{nextAction.title}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-sub">{nextAction.body}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Pill to={nextAction.to} size="sm">{nextAction.cta}</Pill>
              <Pill to="/activities" variant="outline" size="sm">activities</Pill>
            </div>
          </div>

          <div className="border-t border-rule pt-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] lowercase">
                <span className="mr-2 text-sub tabular">03</span>ground drop
              </h2>
              <button
                type="button"
                onClick={() => downloadIcs(settings)}
                className="rounded-full border-[1.5px] border-ink px-3 py-1.5 text-[12px] lowercase transition-colors hover:border-caramel hover:text-caramel"
              >
                add to outlook calendar
              </button>
            </div>
            <div className="mt-4">
              <GroundDropCalendar settings={settings} />
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-sub">
              Grounds are not pre-bagged. The technician empties the machine bin into the lidded caddy on the{" "}
              {myRow?.code} table; scoop, tare the scale, weigh. Leftovers go to normal waste on{" "}
              {st.clearOutLabel}.
            </p>
          </div>

          <div className="border-t border-rule pt-5">
            <h2 className="text-[15px] lowercase">
              <span className="mr-2 text-sub tabular">04</span>floor of the month
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-sub">
              Announced in the Sustainability team&rsquo;s monthly email. This month: team breakfast at Marina
              Bay funded by Harbourline, or a donation to the floor&rsquo;s chosen charity.
            </p>
            <Link to="/leaderboard" className="mt-2 inline-block text-[13px] underline decoration-rule underline-offset-4 hover:text-caramel">
              see the standings
            </Link>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between border-b border-rule pb-3">
          <h2 className="text-[15px] lowercase">
            <span className="mr-2 text-sub tabular">05</span>what the data says
          </h2>
          <span className="text-[11px] uppercase tracking-[0.14em] text-sub">floor level in public</span>
        </div>
        <div className="pt-3">
          <NudgeList items={nudges.slice(0, 3)} privateItems={privateNudges} />
        </div>
      </div>
    </div>
  );
}
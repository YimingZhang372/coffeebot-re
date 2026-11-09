import { useEffect, useState } from "react";
import { Image } from "@/components/ui/image";
import { IMG } from "@/lib/assets";
import { bidPhase, countdownParts, clockLabel, monthTitle, shortDate } from "@/lib/pledge";

function Cell({ value, label }) {
  return (
    <div className="min-w-[54px] border-l border-white/20 pl-3">
      <div className="display tabular text-[24px] leading-none text-white">{String(value).padStart(2, "0")}</div>
      <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/50">{label}</div>
    </div>
  );
}

/** Pledge night photo, the month title and the countdown to the final bid. */
export default function PledgeHeader({ config, month }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const phase = bidPhase(config, now);
  const c = countdownParts(phase.ms);

  return (
    <div className="relative overflow-hidden rounded-[2px] bg-ink">
      <Image
        src={IMG.pledgeNight}
        alt="Champions at the Harbourline pledge night"
        fittingType="fill"
        className="h-[300px] w-full sm:h-[380px]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-ink/10" />

      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-5 p-5 sm:p-7">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
            pledge auction · {monthTitle(month)} · pledge night {shortDate(config.pledgeNightAt)}
          </p>
          <h1 className="display mt-2 text-[42px] text-white sm:text-[68px]">pledge / {monthTitle(month).split(" ")[0].toLowerCase()}</h1>
          <p className="mt-2 max-w-[52ch] text-[12.5px] leading-relaxed text-white/70">
            Six floors bid the uplift they will reach. Half volume, half uplift: the highest score is Floor of the Month.
          </p>
        </div>

        <div className="flex items-center">
          <div className="pr-3">
            <div className="text-[9px] uppercase tracking-[0.16em] text-white/50">{phase.label}</div>
            <div className="mt-1 text-[12px] text-white">
              {shortDate(phase.at)} · {clockLabel(phase.at)}
            </div>
          </div>
          <Cell value={c.d} label="days" />
          <Cell value={c.h} label="hrs" />
          <Cell value={c.m} label="min" />
          <Cell value={c.s} label="sec" />
        </div>
      </div>

      <span className="absolute left-5 top-5 flex h-6 items-center border border-white/30 px-2 text-[9px] uppercase tracking-[0.16em] text-white/70">
        {phase.open ? "final bid window open · raise only" : phase.phase === "before" ? "opening bids placed" : "final bids closed"}
      </span>
    </div>
  );
}
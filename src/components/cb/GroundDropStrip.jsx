import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { groundDropState } from "@/lib/groundDrop";
import { useProgramme } from "@/lib/programmeData";

export default function GroundDropStrip() {
  const { settings, me, myRow } = useProgramme();
  const [, tick] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const st = groundDropState(settings);
  const today = st.windowOpen;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`${today ? "bg-caramel" : "bg-ink"} px-5 py-2.5 sm:px-8`}
    >
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-1 text-[12px] uppercase tracking-[0.1em] text-white/85">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-white/55">{today ? "ground drop today" : "next ground drop"}</span>
          <span className="text-white">{st.nextLabel}</span>
          <span className="text-white/40">·</span>
          <span className="text-white">{st.time}</span>
          <span className="text-white/40">·</span>
          <span className="text-white">{(me?.floorCode || "L10")} table</span>
          <span className="text-white/40">·</span>
          {today ? (
            <span className="text-white">available until {st.clearOutLabel}</span>
          ) : (
            <span className="text-white">
              in <span className="tabular">{st.countdown}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-5 text-white/55">
          {myRow && (
            <span>
              {myRow.code} rank <span className="text-white tabular">{myRow.rank}</span> of 6
            </span>
          )}
          <span className="hidden sm:inline">use within 48 h or dry them</span>
        </div>
      </div>
    </motion.div>
  );
}
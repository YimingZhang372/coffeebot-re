import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PledgeBoard from "./PledgeBoard";
import { clockLabel, monthTitle, shortDate } from "@/lib/pledge";

/** Full-screen board for a meeting-room screen. Rows animate as bids and validations land. */
export default function PresentMode({ rows, myFloor, config, month, onClose }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-ink px-6 py-6 text-white"
    >
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/15 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">pledge auction · present mode</p>
            <h1 className="display mt-1 text-[34px] leading-none text-white sm:text-[54px]">
              pledge / {monthTitle(month).split(" ")[0].toLowerCase()}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/60">
              month closes {shortDate(config.monthCloseAt)} · {clockLabel(config.monthCloseAt)}
            </p>
            <p className="mt-1 text-[11px] text-white/40">
              final bid {shortDate(config.finalBidOpenAt)} · {clockLabel(config.finalBidOpenAt)}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-full border border-white/30 px-3 py-1 text-[11px] lowercase text-white/70 hover:border-white hover:text-white"
            >
              exit · esc
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-[2px] bg-canvas px-4 py-3 text-ink">
          <PledgeBoard rows={rows} myFloor={myFloor} dense />
        </div>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-white/40">
          projected until the month closes · every figure from weighed collections and validated reuse
        </p>
      </div>
    </motion.div>
  );
}
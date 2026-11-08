import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";

/** Catalogue-style floor index: rank · FLOOR NAME · progress line · g per employee. */
export default function RankingIndex({ rows, myFloor, limit, showParticipation = true, dense = false }) {
  const reduce = useReducedMotion();
  const list = limit ? rows.slice(0, limit) : rows;
  const top = rows[0]?.perEmployee || 1;

  return (
    <div>
      {list.map((r, i) => {
        const mine = r.code === myFloor;
        return (
          <motion.div
            key={r.code}
            layout={!reduce}
            transition={{ duration: 0.35, ease: "easeOut" }}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`group grid grid-cols-[34px_1fr_auto] items-center gap-x-4 border-b border-rule px-2 ${dense ? "py-2.5" : "py-3.5"} transition-colors duration-200 hover:bg-white/60`}
            style={mine ? { boxShadow: "inset 2px 0 0 0 hsl(var(--cb-caramel))" } : undefined}
          >
            <span className={`text-[12px] tabular ${mine ? "text-caramel" : "text-sub"}`}>
              {String(r.rank).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="display truncate text-[17px] sm:text-[20px]">{r.code}</span>
                <span className="truncate text-[13px] text-sub">{r.name}</span>
                {mine && <span className="text-[10px] uppercase tracking-[0.14em] text-caramel">my floor</span>}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="h-[2px] flex-1 bg-rule/70">
                  <motion.span
                    className={`block h-[2px] ${mine ? "bg-caramel" : "bg-ink"}`}
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${Math.max(2, (r.perEmployee / top) * 100)}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 * i }}
                  />
                </span>
                {showParticipation && (
                  <span className="hidden text-[11px] tabular text-sub sm:inline">
                    {Math.round(r.participation)}% / {r.target}%
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[17px] tabular text-ink">{Math.round(r.perEmployee)}</div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-sub">g / employee</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function RankingFooter({ to = "/leaderboard" }) {
  return (
    <div className="mt-3 flex items-center justify-between text-[12px] text-sub">
      <span>monthly reset · all-time figures in leaderboard</span>
      <Link to={to} className="text-ink underline decoration-rule underline-offset-4 hover:text-caramel">
        full leaderboard
      </Link>
    </div>
  );
}
import { motion, useReducedMotion } from "framer-motion";

const STEPS = [
  { idx: "01", key: "collect", label: "collect", desc: "weigh what you took" },
  { idx: "02", key: "reuse", label: "reuse", desc: "get an activity" },
  { idx: "03", key: "share", label: "share", desc: "photo and grams" },
  { idx: "04", key: "score", label: "score", desc: "points for your floor" },
];

export default function Stepper({ current = "collect" }) {
  const reduce = useReducedMotion();
  const currentIdx = Math.max(0, STEPS.findIndex((s) => s.key === current));
  return (
    <ol className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-4">
      {STEPS.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <motion.li
            key={s.key}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.05 }}
            className={`relative bg-canvas px-4 py-4 ${active ? "bg-white" : ""}`}
          >
            <div className="flex items-baseline gap-2">
              <span className={`text-[11px] tabular ${active ? "text-caramel" : "text-sub/70"}`}>{s.idx}</span>
              <span className={`text-[15px] lowercase ${done ? "text-sub" : "text-ink"}`}>{s.label}</span>
            </div>
            <p className="mt-1 text-[12px] leading-snug text-sub">{s.desc}</p>
            {active && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-caramel" />}
          </motion.li>
        );
      })}
    </ol>
  );
}
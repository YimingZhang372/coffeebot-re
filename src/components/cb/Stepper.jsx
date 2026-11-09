const STEPS = [
  { idx: "01", key: "collect", label: "collect" },
  { idx: "02", key: "reuse", label: "reuse" },
  { idx: "03", key: "share", label: "share" },
  { idx: "04", key: "score", label: "score" },
];

/** One horizontal index row: 01 / collect · 02 / reuse · 03 / share · 04 / score. */
export default function Stepper({ current = "collect" }) {
  const currentIdx = Math.max(0, STEPS.findIndex((s) => s.key === current));
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] lowercase">
      {STEPS.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={s.key} className="flex items-center gap-3">
            <span
              className={`flex items-baseline gap-1.5 ${
                active ? "text-ink" : done ? "text-sub" : "text-sub/70"
              }`}
            >
              <span className={`text-[11px] tabular ${active ? "text-caramel" : "text-sub/60"}`}>{s.idx}</span>
              <span className="text-sub/40">/</span>
              <span className={active ? "border-b border-caramel pb-0.5" : ""}>{s.label}</span>
            </span>
            {i < STEPS.length - 1 && <span className="text-sub/40">·</span>}
          </li>
        );
      })}
    </ol>
  );
}
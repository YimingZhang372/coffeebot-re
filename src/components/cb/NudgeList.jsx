export default function NudgeList({ items = [], privateItems = [] }) {
  const all = [
    ...privateItems.map((p) => ({ text: p, kind: "private" })),
    ...items.map((t) => ({ text: t, kind: "public" })),
  ];
  if (!all.length) return null;
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {all.map((n, i) => (
        <li key={i} className="flex items-start gap-3 py-2.5">
          <span
            className={`mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full ${
              n.kind === "private" ? "bg-caramel" : "bg-ink/40"
            }`}
          />
          <span className={`text-[13px] leading-relaxed ${n.kind === "private" ? "text-ink" : "text-sub"}`}>
            {n.text}
          </span>
          <span className="ml-auto shrink-0 pt-[3px] text-[10px] uppercase tracking-[0.12em] text-sub/60">
            {n.kind === "private" ? "only you" : "floor"}
          </span>
        </li>
      ))}
    </ul>
  );
}
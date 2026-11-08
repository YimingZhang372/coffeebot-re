const tone = {
  available: { chip: "border-verdant/40 bg-verdant/12 text-verdant", bar: "bg-verdant", label: "Available" },
  low: { chip: "border-amberish/40 bg-amberish/12 text-[#8F6539]", bar: "bg-amberish", label: "Running low" },
  empty: { chip: "border-rule bg-[#EAE7E3] text-sub", bar: "bg-[#C4BFBA]", label: "Empty" },
};

export default function Tower2D({ floors, selected, myFloor, onSelect }) {
  return (
    <div className="space-y-1.5">
      {floors
        .slice()
        .reverse()
        .map((f) => {
          if (!f.status) {
            return (
              <div key={f.code} className="flex h-7 items-center justify-between border border-dashed border-rule/60 px-3 text-[10px] uppercase tracking-[0.14em] text-sub/60">
                <span>{f.code}</span>
                <span>outside the programme</span>
              </div>
            );
          }
          const t = tone[f.status] || tone.empty;
          const active = f.code === selected;
          return (
            <button
              key={f.code}
              type="button"
              onClick={() => onSelect(f.code)}
              className={`flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-colors ${
                active ? "border-ink bg-white" : "border-rule bg-white/50 hover:border-ink"
              }`}
              style={f.code === myFloor ? { boxShadow: "inset 2px 0 0 0 hsl(var(--cb-caramel))" } : undefined}
            >
              <span className="w-9 text-[12px] tabular text-sub">{f.code}</span>
              <span className="flex-1">
                <span className="block text-[13px] text-ink">{f.name}</span>
                <span className="block h-[2px] w-full bg-rule/60">
                  <span className={`block h-[2px] ${t.bar}`} style={{ width: `${Math.min(100, (f.stock / 900) * 100)}%` }} />
                </span>
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${t.chip}`}>
                {f.stockLabel}
              </span>
            </button>
          );
        })}
    </div>
  );
}
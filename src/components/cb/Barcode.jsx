import { useMemo } from "react";

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function prng(seed) {
  let a = seed;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic barcode: the same record ID always produces the same bars. */
export default function Barcode({ value = "", height = 32, showValue = true, className = "", light = false }) {
  const bars = useMemo(() => {
    const rand = prng(hash(String(value)));
    const out = [];
    let guard = 0;
    while (out.length < 38 && guard < 200) {
      const w = rand() > 0.72 ? 3 : rand() > 0.4 ? 2 : 1;
      out.push({ w, dark: out.length % 2 === 0 });
      guard += 1;
    }
    return out;
  }, [value]);

  return (
    <div className={className}>
      <div className="flex items-end gap-[1.5px]" style={{ height }} aria-hidden="true">
        {bars.map((b, i) => (
          <span
            key={i}
            className={b.dark ? (light ? "bg-white" : "bg-ink") : "bg-transparent"}
            style={{ width: b.w, height: b.dark ? "100%" : "0%" }}
          />
        ))}
      </div>
      {showValue && (
        <div
          className={`mt-1.5 text-[9px] uppercase tracking-[0.18em] tabular ${
            light ? "text-white/60" : "text-sub"
          }`}
        >
          {value}
        </div>
      )}
    </div>
  );
}
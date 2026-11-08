import CountUp from "@/components/cb/CountUp";

export default function AdminKpi({ label, value, decimals = 0, unit, change, primary = false, note }) {
  return (
    <div className={`border border-rule px-4 py-4 ${primary ? "bg-ink text-white" : "bg-paper"}`}>
      <p className={`text-[10px] uppercase tracking-[0.14em] ${primary ? "text-white/55" : "text-sub"}`}>{label}</p>
      <p className={`mt-1.5 text-[26px] leading-none ${primary ? "text-white" : "text-ink"}`}>
        <CountUp value={value} decimals={decimals} />
        {unit && <span className="ml-1 text-[12px] lowercase tracking-normal">{unit}</span>}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        {typeof change === "number" && (
          <span className={`text-[11px] tabular ${change >= 0 ? "text-verdant" : "text-[#A44A3F]"}`}>
            {change >= 0 ? "+" : ""}
            {change.toFixed(0)}%
          </span>
        )}
        {note && <span className={`text-[11px] ${primary ? "text-white/50" : "text-sub"}`}>{note}</span>}
      </div>
    </div>
  );
}
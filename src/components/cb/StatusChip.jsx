const styles = {
  validated: "border-verdant/40 bg-verdant/10 text-verdant",
  pending: "border-caramel/40 bg-caramel/10 text-[#8F6539]",
  rejected: "border-[#A44A3F]/35 bg-[#A44A3F]/10 text-[#A44A3F]",
  issued: "border-verdant/40 bg-verdant/10 text-verdant",
  draft: "border-rule bg-transparent text-sub",
  revoked: "border-[#A44A3F]/35 bg-[#A44A3F]/10 text-[#A44A3F]",
  neutral: "border-rule bg-transparent text-sub",
  ink: "border-ink bg-ink text-[#d8d4cf]",
};

export default function StatusChip({ status = "neutral", children, className = "" }) {
  const key = String(status).toLowerCase();
  const style = styles[key] || styles.neutral;
  return (
    <span
      className={`inline-flex h-[22px] items-center rounded-full border px-2.5 text-[11px] uppercase tracking-[0.08em] ${style} ${className}`}
    >
      {children || status}
    </span>
  );
}
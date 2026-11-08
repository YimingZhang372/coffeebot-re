export default function EmptyState({ title, body, action }) {
  return (
    <div className="flex flex-col items-start gap-3 border border-dashed border-rule bg-white/40 px-6 py-10">
      <p className="text-[15px] text-ink">{title}</p>
      {body && <p className="max-w-[46ch] text-[13px] leading-relaxed text-sub">{body}</p>}
      {action}
    </div>
  );
}
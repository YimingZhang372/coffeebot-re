/** Renders comment text with @L11 style floor mentions as chips. */
export default function MentionText({ text, className = "" }) {
  const parts = String(text || "").split(/(@L\d{1,2})/g);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        /^@L\d{1,2}$/.test(part) ? (
          <span
            key={i}
            className="mx-0.5 inline-flex items-center rounded-full border border-caramel/50 bg-caramel/10 px-1.5 text-[10px] uppercase tracking-[0.08em] text-caramel"
          >
            {part.slice(1)}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
}
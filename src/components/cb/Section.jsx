export default function Section({ index, title, aside, children, className = "" }) {
  return (
    <section className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-3">
        <h2 className="text-[15px] lowercase text-ink">
          {index && <span className="mr-2 text-sub tabular">{index}</span>}
          {title}
        </h2>
        {aside}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}
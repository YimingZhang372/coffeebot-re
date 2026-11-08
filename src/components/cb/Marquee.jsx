import { Link } from "react-router-dom";

/** Black band of uppercase live programme messages, separated by caramel dots. */
export default function Marquee({ items = [], to, speed = 46, className = "" }) {
  const messages = items.length ? items : ["CoffeeBot Re"];
  const doubled = [...messages, ...messages];
  return (
    <div className={`overflow-hidden bg-ink ${className}`}>
      <div className="cb-marquee-track" style={{ animationDuration: `${speed}s` }}>
        {doubled.map((m, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-6 px-6 py-3 text-[13px] uppercase tracking-[0.06em] text-[#d8d4cf]"
          >
            {to ? (
              <Link to={to} className="transition-colors hover:text-white">
                {m}
              </Link>
            ) : (
              m
            )}
            <span className="h-1.5 w-1.5 rounded-full bg-caramel" />
          </span>
        ))}
      </div>
    </div>
  );
}
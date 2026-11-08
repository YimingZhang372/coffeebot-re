import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { timeAgo } from "@/lib/programme";
import { useProgramme } from "@/lib/programmeData";

export default function NotificationBell() {
  const { notifications, unread, markAllRead } = useProgramme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications, ${unread} unread`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-rule bg-white text-[13px] transition-colors hover:border-ink"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-caramel px-1 text-[10px] tabular text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-[min(92vw,380px)] border border-rule bg-paper shadow-[0_24px_60px_-30px_rgba(20,20,20,0.4)]">
          <div className="flex items-center justify-between border-b border-rule px-4 py-3">
            <span className="text-[12px] uppercase tracking-[0.14em] text-sub">notifications</span>
            <button type="button" onClick={markAllRead} className="text-[12px] text-sub hover:text-ink">
              mark all read
            </button>
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-8 text-[13px] text-sub">Nothing new. Reminders arrive the day before each Ground Drop.</p>
            )}
            {notifications.map((n) => (
              <Link
                key={n.id}
                to={n.link || "/"}
                onClick={() => setOpen(false)}
                className={`block border-b border-rule/70 px-4 py-3 transition-colors hover:bg-[#F7F5F3] ${n.read ? "" : "bg-[#FBF7F2]"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-medium text-ink">{n.title}</span>
                  {!n.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-caramel" />}
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-sub">{n.body}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-sub/70">{timeAgo(n.occurredAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
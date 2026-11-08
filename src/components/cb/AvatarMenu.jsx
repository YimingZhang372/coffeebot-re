import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProgramme } from "@/lib/programmeData";
import { useSession } from "@/lib/session";

export default function AvatarMenu() {
  const { me } = useProgramme();
  const { signOut } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const initials = (me?.name || "—")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const roleLabel =
    me?.role === "champion" ? "Floor Champion" : me?.role === "admin" ? "Sustainability Admin" : "Employee";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-full border border-rule bg-white pl-1 pr-3 transition-colors hover:border-ink"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[11px] tracking-wide text-white">
          {initials}
        </span>
        <span className="hidden text-[13px] text-ink sm:inline">{me?.floorCode || "—"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-[240px] border border-rule bg-paper p-1 shadow-[0_24px_60px_-30px_rgba(20,20,20,0.4)]">
          <div className="border-b border-rule px-3 py-3">
            <div className="text-[14px] text-ink">{me?.name}</div>
            <div className="text-[12px] text-sub">
              {me?.floorCode} · {me?.department}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-sub">{roleLabel}</div>
          </div>
          <Link to="/me" onClick={() => setOpen(false)} className="block px-3 py-2 text-[13px] hover:bg-[#F7F5F3]">
            my profile
          </Link>
          {me?.role === "admin" ? (
            <Link to="/admin" onClick={() => setOpen(false)} className="block px-3 py-2 text-[13px] hover:bg-[#F7F5F3]">
              sustainability console
            </Link>
          ) : (
            <Link to="/admin/login" onClick={() => setOpen(false)} className="block px-3 py-2 text-[13px] text-sub hover:bg-[#F7F5F3]">
              programme administrator
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              signOut();
              setOpen(false);
              navigate("/login");
            }}
            className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[#F7F5F3]"
          >
            sign out
          </button>
        </div>
      )}
    </div>
  );
}
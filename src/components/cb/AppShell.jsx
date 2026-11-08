import { useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "@/lib/session";
import { useProgramme } from "@/lib/programmeData";
import { IMG, HARBOURLINE_MARK } from "@/lib/assets";
import GroundDropStrip from "./GroundDropStrip";
import Ticker from "./Ticker";
import MenuOverlay from "./MenuOverlay";
import NotificationBell from "./NotificationBell";
import AvatarMenu from "./AvatarMenu";
import Skeleton from "./Skeleton";

const LABELS = {
  "/": "home",
  "/collect": "collect",
  "/activities": "activities",
  "/community": "community",
  "/leaderboard": "leaderboard",
  "/me": "me",
  "/about": "about the programme",
};

export default function AppShell() {
  const { session } = useSession();
  const { loading, me } = useProgramme();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isPublic = location.pathname === "/about";
  if (!session?.email && !isPublic) return <Navigate to="/login" replace />;
  if (loading) {
    return (
      <div className="min-h-screen bg-canvas px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1280px]">
          <Skeleton rows={6} />
        </div>
      </div>
    );
  }
  if (me && !me.profileSet && location.pathname !== "/welcome") return <Navigate to="/welcome" replace />;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="border-b border-rule bg-canvas px-5 py-1.5 text-center text-[11px] uppercase tracking-[0.12em] text-sub sm:px-8">
        Pilot programme · quantities are weighed at collection and employee-reported at reuse
      </div>

      <header className="sticky top-0 z-30 border-b border-rule bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-5 py-3 sm:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] lowercase text-[#d8d4cf] transition-colors hover:bg-caramel hover:text-white"
          >
            menu
            <span className="flex flex-col gap-[3px]">
              <span className="block h-[1.5px] w-4 bg-current" />
              <span className="block h-[1.5px] w-4 bg-current" />
            </span>
          </button>

          <Link to="/" className="ml-2 hidden items-center gap-3 sm:flex">
            <img src={IMG.logo} alt="CoffeeBot" className="h-11 w-auto shrink-0" />
            <span className="h-5 w-px bg-rule" />
            <span className="text-[11px] uppercase tracking-[0.14em] text-sub">Deployed at Harbourline Bank</span>
          </Link>

          <div className="ml-auto flex items-center gap-2.5">
            <nav className="mr-2 hidden items-center gap-4 text-[13px] lowercase text-sub lg:flex">
              <Link to="/" className="hover:text-ink">home</Link>
              <Link to="/collect" className="hover:text-ink">collect</Link>
              <Link to="/community" className="hover:text-ink">community</Link>
              <Link to="/leaderboard" className="hover:text-ink">leaderboard</Link>
            </nav>
            <NotificationBell />
            <AvatarMenu />
          </div>
        </div>
      </header>

      <GroundDropStrip />
      <Ticker />

      <main className="mx-auto max-w-[1280px] px-5 pb-16 pt-7 sm:px-8">
        <div className="mb-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-sub">
          <Link to="/" className="hover:text-ink">coffeebot re</Link>
          <span>/</span>
          <span className="text-ink">{LABELS[location.pathname] || location.pathname.replace("/", "")}</span>
        </div>
        <Outlet />
      </main>

      <footer className="border-t border-rule px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 text-[12px] text-sub">
          <div className="flex items-center gap-3">
            <img src={IMG.logo} alt="CoffeeBot" className="h-7 w-auto opacity-80" />
            <span>CoffeeBot Re v2.3</span>
            <span className="hidden h-4 w-px bg-rule sm:block" />
            <span className="hidden items-center gap-2 sm:flex">
              <span className="flex h-4 items-center border border-rule px-1 text-[8px] tracking-[0.14em]">{HARBOURLINE_MARK}</span>
              Deployed at Harbourline Bank
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/about" className="hover:text-ink">Privacy</Link>
            <Link to="/about" className="hover:text-ink">Data retention policy</Link>
            <Link to="/about" className="hover:text-ink">Support</Link>
            <span className="tabular">last updated 07 nov 2026, 09:14 sgt</span>
          </div>
        </div>
      </footer>

      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
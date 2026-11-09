import { useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useSession } from "@/lib/session";
import { useProgramme } from "@/lib/programmeData";
import { IMG, HARBOURLINE_MARK } from "@/lib/assets";
import Skeleton from "@/components/cb/Skeleton";

const NAV = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/activity", label: "Activity" },
  { to: "/admin/validation", label: "Validation" },
  { to: "/admin/floors", label: "Floors" },
  { to: "/admin/pledges", label: "Pledges" },
  { to: "/admin/tables", label: "Collection tables" },
  { to: "/admin/certificates", label: "ESG Certificates" },
  { to: "/admin/email", label: "Monthly email" },
  { to: "/admin/carbon", label: "Carbon module" },
  { to: "/admin/calculations", label: "How we calculate" },
  { to: "/admin/settings", label: "Programme settings" },
  { to: "/admin/audit", label: "Audit log" },
];

export default function AdminShell() {
  const { session, signOut } = useSession();
  const { loading, me, viewAs, exitViewAs } = useProgramme();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  if (!session?.email) return <Navigate to="/admin/login" replace />;
  if (loading) {
    return (
      <div className="min-h-screen bg-canvas p-8">
        <Skeleton rows={8} />
      </div>
    );
  }
  if (me && me.role !== "admin") {
    return (
      <div className="min-h-screen bg-canvas px-5 py-16">
        <div className="mx-auto max-w-[520px] bg-paper p-8">
          <p className="text-[12px] uppercase tracking-[0.14em] text-sub">access denied</p>
          <h1 className="mt-2 text-[22px] text-ink">Your account does not have access to the Sustainability Console.</h1>
          <p className="mt-2 text-[13px] text-sub">Only Sustainability Admin accounts can enter this area.</p>
          <div className="mt-4 flex gap-2">
            <Link to="/" className="rounded-full bg-ink px-5 py-2 text-[13px] text-white">back to the programme</Link>
            <Link to="/admin/login" className="rounded-full border border-rule px-5 py-2 text-[13px] text-sub">sign in as another account</Link>
          </div>
        </div>
      </div>
    );
  }

  const current = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));

  return (
    <div className="min-h-screen bg-[#F5F4F2] text-ink">
      <div className="border-b border-rule bg-canvas px-4 py-1 text-center text-[10px] uppercase tracking-[0.12em] text-sub">
        Pilot programme · quantities are weighed at collection and employee-reported at reuse
      </div>

      {viewAs && (
        <div className="flex flex-wrap items-center justify-center gap-3 bg-ink px-4 py-1.5 text-[11px] lowercase text-[#d8d4cf]">
          <span>viewing the programme as {viewAs}</span>
          <button
            type="button"
            onClick={() => exitViewAs()}
            className="rounded-full border border-white/30 px-2.5 py-0.5 hover:border-white hover:text-white"
          >
            back to the administrator view
          </button>
        </div>
      )}

      <div className="flex min-h-[calc(100vh-26px)]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[240px] shrink-0 border-r border-rule bg-[#FAF9F7] transition-transform lg:static lg:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-rule px-5 py-4">
              <img src={IMG.logo} alt="CoffeeBot" className="h-10 w-auto shrink-0" />
              <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-sub">Sustainability Console</p>
            </div>

            <nav className="flex-1 overflow-y-auto py-3">
              {NAV.map((n, i) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 border-l-2 px-5 py-2 text-[13px] transition-colors ${
                      isActive ? "border-caramel bg-white text-ink" : "border-transparent text-sub hover:text-ink"
                    }`
                  }
                >
                  <span className="w-4 text-[10px] tabular text-sub/60">{String(i + 1).padStart(2, "0")}</span>
                  {n.label}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-rule px-5 py-4 text-[11px]">
              <p className="text-ink">{me?.name}</p>
              <p className="text-sub">Group Sustainability</p>
              <p className="mt-1 flex items-center gap-2">
                <span className="flex h-4 items-center border border-rule px-1 text-[7px] tracking-[0.12em] text-sub">
                  {HARBOURLINE_MARK}
                </span>
                <span className="text-sub">Harbourline Bank</span>
              </p>
              <div className="mt-3 space-y-1.5">
                <Link to="/?viewAs=chloe.tan@harbourline-demo.com" className="block text-sub hover:text-ink">view as employee →</Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    window.location.href = "/admin/login";
                  }}
                  className="block text-left text-sub hover:text-ink"
                >
                  sign out
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-rule bg-[#F5F4F2]/95 px-4 py-2.5 backdrop-blur sm:px-6">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full border border-rule px-3 py-1.5 text-[12px] lg:hidden"
            >
              menu
            </button>
            <div className="flex min-w-0 items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-sub">
              <Link to="/admin" className="hover:text-ink">console</Link>
              <span>/</span>
              <span className="truncate text-ink">{current?.label || "Overview"}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Link
                to="/?viewAs=chloe.tan@harbourline-demo.com"
                className="hidden rounded-full border border-rule px-3 py-1.5 text-[12px] lowercase text-sub hover:border-ink hover:text-ink sm:block"
              >
                view as employee
              </Link>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[10px] text-white">
                {(me?.name || "—").split(" ").slice(0, 2).map((p) => p[0]).join("")}
              </span>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6">
            <Outlet />
          </main>

          <footer className="border-t border-rule px-6 py-4 text-[11px] text-sub">
            CoffeeBot Re v2.3 · Sustainability Console · figures derive from collection and reuse records ·{" "}
            <Link to="/about" className="hover:text-ink">data retention policy</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
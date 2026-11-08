import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useProgramme } from "@/lib/programmeData";
import { useSession } from "@/lib/session";
import { IMG } from "@/lib/assets";

const links = [
  { to: "/", label: "home", idx: "01" },
  { to: "/collect", label: "collect", idx: "02" },
  { to: "/activities", label: "activities", idx: "03" },
  { to: "/community", label: "community", idx: "04" },
  { to: "/leaderboard", label: "leaderboard", idx: "05" },
  { to: "/me", label: "me", idx: "06" },
  { to: "/about", label: "about the programme", idx: "07" },
];

export default function MenuOverlay({ open, onClose }) {
  const { me, myRow } = useProgramme();
  const { signOut } = useSession();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const go = (to) => {
    onClose();
    navigate(to);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="grain fixed inset-0 z-50 overflow-y-auto bg-ink text-white"
        >
          <div className="mx-auto flex min-h-full max-w-[1280px] flex-col px-5 py-6 sm:px-8">
            <div className="flex items-center justify-between">
              <img src={IMG.logo} alt="CoffeeBot" className="h-10 w-auto" />
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/25 px-5 py-2 text-[13px] lowercase text-white transition-colors hover:border-caramel hover:text-caramel"
              >
                close ✕
              </button>
            </div>

            <nav className="mt-10 flex-1">
              {links.map((l, i) => (
                <motion.button
                  key={l.to}
                  type="button"
                  onClick={() => go(l.to)}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: 0.04 * i }}
                  className="group flex w-full items-baseline gap-5 border-b border-white/12 py-3 text-left"
                >
                  <span className="w-8 text-[12px] tabular text-white/40">{l.idx}</span>
                  <span className="text-[38px] lowercase leading-none text-white transition-colors duration-200 group-hover:text-caramel sm:text-[56px]">
                    {l.label}
                  </span>
                </motion.button>
              ))}
            </nav>

            <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-white/12 pt-6 text-[13px] text-white/60">
              <div>
                <div className="text-white">{me?.name || "Not signed in"}</div>
                <div>
                  {me?.floorCode ? `${me.floorCode} · ${me.department}` : "Profile not set"} ·{" "}
                  {me?.role === "champion" ? "Floor Champion" : me?.role === "admin" ? "Sustainability Admin" : "Employee"}
                </div>
                {myRow && (
                  <div className="mt-1">
                    rank {myRow.rank} of 6 · {(myRow.perEmployee / 1000).toFixed(3)} kg per employee
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {me?.role === "admin" && (
                  <Link to="/admin" onClick={onClose} className="text-white underline decoration-white/30 underline-offset-4 hover:text-caramel">
                    sustainability console
                  </Link>
                )}
                <Link to="/demo" onClick={onClose} className="hover:text-white">
                  demo accounts
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    onClose();
                    navigate("/login");
                  }}
                  className="rounded-full bg-white px-5 py-2 text-[13px] text-ink transition-colors hover:bg-caramel hover:text-white"
                >
                  sign out
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
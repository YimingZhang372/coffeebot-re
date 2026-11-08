import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { IMG, HARBOURLINE_MARK } from "@/lib/assets";
import Marquee from "@/components/cb/Marquee";
import Ticket from "@/components/cb/Ticket";
import Pill from "@/components/cb/Pill";
import LoginGrid from "@/components/cb/LoginGrid";
import { useSession } from "@/lib/session";
import { useProgramme } from "@/lib/programmeData";
import { formatSgt } from "@/lib/programme";

const PHOTO_KEYS = ["plant", "mushrooms", "compost", "scrub", "deodoriser", "grounds", "plant", "compost"];

const MARQUEE = [
  "L11 leads L10 by 5 g reused per employee",
  "5 more colleagues for L10 to reach 30%",
  "next ground drop tue 10 nov · 10:00",
  "L10 vs L11 challenge live, 2 to 15 nov",
];

function Preloader({ onDone }) {
  const [pct, setPct] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      onDone();
      return;
    }
    const start = performance.now();
    let frame;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 1200);
      setPct(Math.round(p * 100));
      if (p < 1) frame = requestAnimationFrame(tick);
      else setTimeout(onDone, 120);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onDone, reduce]);

  return (
    <motion.div
      className="grain fixed inset-0 z-50 flex flex-col justify-between bg-ink px-6 py-6"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between">
        <img src={IMG.logo} alt="CoffeeBot" className="h-8 w-auto" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/50">coffeebot re v2.3</span>
      </div>
      <div className="display tabular text-[20vw] leading-none text-white sm:text-[160px]">
        {String(pct).padStart(2, "0")}%
      </div>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/50">
        <span>loading programme</span>
        <span>sgt / singapore</span>
      </div>
    </motion.div>
  );
}

export default function Login() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useSession();
  const { reuses } = useProgramme();
  const reduce = useReducedMotion();
  const validatedCount = reuses.filter((r) => r.status === "validated").length;

  const enter = (workEmail, role) => {
    signIn({ email: workEmail, role });
    navigate("/");
  };

  const submit = (e) => {
    e.preventDefault();
    if (busy) return;
    const value = email.trim().toLowerCase();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter your Harbourline work email address.");
      return;
    }
    setError("");
    setBusy(true);
    enter(value, "auto");
  };

  return (
    <div className="relative min-h-screen bg-canvas text-ink">
      <AnimatePresence>{loading && <Preloader onDone={() => setLoading(false)} />}</AnimatePresence>

      <div className="bg-ink px-5 py-2 text-center text-[11px] uppercase tracking-[0.14em] text-white/55">
        Pilot programme · quantities are weighed at collection and employee-reported at reuse
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <header className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-10">
          <div className="flex items-center gap-4">
            <img src={IMG.logo} alt="CoffeeBot" className="h-16 w-auto shrink-0" />
            <span className="hidden h-9 w-px bg-rule sm:block" />
            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="flex h-8 items-center border border-rule px-2 text-[10px] font-semibold tracking-[0.16em] text-ink">
                {HARBOURLINE_MARK}
              </span>
              <span className="text-[12px] text-sub">Deployed at Harbourline Bank</span>
            </div>
          </div>
          <nav className="flex items-center gap-5 text-[14px] text-sub">
            <Link to="/about" className="transition-colors hover:text-ink">
              about the programme
            </Link>
            <Link to="/demo" className="transition-colors hover:text-ink">
              demo accounts
            </Link>
          </nav>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="px-5 pb-14 pt-6 sm:px-10 lg:pb-20">
            <div className="text-[11px] uppercase tracking-[0.22em] text-sub">
              harbourline bank · sustainability programme
            </div>
            <h1 className="display mt-5 text-[54px] sm:text-[88px] xl:text-[104px]">
              grounds
              <br />
              into
              <br />
              evidence.
            </h1>
            <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-sub">
              CoffeeBot Re collects the spent grounds from the tabletop machines on each
              Harbourline floor, weighs them at the collection table, and turns the reuse your
              colleagues report into a validated, report-ready ESG figure.
            </p>

            <div className="mt-9 max-w-[520px]">
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 18, rotate: 0 }}
                animate={loading ? {} : { opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
              >
                <Ticket id="CB-ACC-2026-MB" rotate={-2.4}>
                  <h2 className="text-[17px] font-medium">Sign in to the programme</h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-sub">
                    Marina Bay · 6 floors · 150 employees
                  </p>

                  <Pill
                    className="mt-6 w-full"
                    size="lg"
                    onClick={() => enter("demo.employee@harbourline-demo.com", "employee")}
                    type="button"
                  >
                    sign in with harbourline sso
                  </Pill>

                  <div className="my-6 flex items-center gap-3">
                    <span className="h-px flex-1 bg-rule" />
                    <span className="text-[11px] uppercase tracking-[0.16em] text-sub">
                      or use your work email
                    </span>
                    <span className="h-px flex-1 bg-rule" />
                  </div>

                  <form onSubmit={submit} className="space-y-3">
                    <label className="block text-[11px] uppercase tracking-[0.16em] text-sub">
                      work email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="name@harbourline.com"
                      className="h-12 w-full rounded-full border border-rule bg-white px-5 text-[15px] outline-none transition-colors placeholder:text-[#A8A29C] focus:border-ink"
                    />
                    {error && <p className="px-1 text-[12px] text-[hsl(var(--destructive))]">{error}</p>}
                    <Pill type="submit" variant="outline" className="w-full" size="lg" disabled={busy}>
                      {busy ? "checking your floor…" : "continue with work email"}
                    </Pill>
                  </form>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-rule pt-4 text-[12px]">
                    <Link to="/admin/login" className="text-sub underline decoration-rule underline-offset-4 transition-colors hover:text-ink">
                      programme administrator? sign in here
                    </Link>
                    <span className="text-sub">last updated {formatSgt(new Date())}</span>
                  </div>
                </Ticket>
              </motion.div>
            </div>
          </div>

          <div className="min-h-[320px] px-5 pb-14 pt-6 sm:px-10 lg:min-h-[640px] lg:pb-20">
            <LoginGrid />
          </div>
        </div>

        <Marquee items={MARQUEE} />

        <section className="px-5 py-14 sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="display text-[28px] sm:text-[38px]">made by harbourline</h2>
            <p className="text-[13px] text-sub">
              validated reuses this year · {validatedCount} &nbsp;·&nbsp; names withheld
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-[6px] sm:grid-cols-4">
            {PHOTO_KEYS.map((key, i) => (
              <motion.figure
                key={`${key}-${i}`}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, ease: "easeOut", delay: (i % 4) * 0.05 }}
                className="group relative aspect-[4/3] overflow-hidden rounded-[2px] bg-[#D6D2CD]"
              >
                <img
                  src={IMG[key]}
                  alt="A validated coffee ground reuse"
                  className="h-full w-full object-cover grayscale opacity-35 transition-all duration-[400ms] ease-out group-hover:grayscale-0 group-hover:opacity-100"
                />
                <figcaption className="absolute bottom-2 left-2 text-[10px] uppercase tracking-[0.14em] text-white/0 transition-colors duration-300 group-hover:text-white">
                  {i % 3 === 0 ? "L11 · plant fertiliser" : i % 3 === 1 ? "L9 · oyster mushrooms" : "L12 · compost booster"}
                </figcaption>
              </motion.figure>
            ))}
            <div className="hidden rounded-[2px] border border-rule sm:block" />
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-5 py-6 text-[12px] text-sub sm:px-10">
          <div className="flex items-center gap-3">
            <img src={IMG.logo} alt="CoffeeBot" className="h-7 w-auto opacity-80" />
            <span>CoffeeBot Re v2.3</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/about" className="hover:text-ink">Privacy</Link>
            <Link to="/about" className="hover:text-ink">Data retention policy</Link>
            <Link to="/about" className="hover:text-ink">Support</Link>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
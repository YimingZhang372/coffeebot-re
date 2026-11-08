import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useSession } from "@/lib/session";
import { IMG, HARBOURLINE_MARK } from "@/lib/assets";
import Pill from "@/components/cb/Pill";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { session, signIn, signOut } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session?.role === "admin") navigate("/admin", { replace: true });
  }, [session, navigate]);

  const attempt = async (value) => {
    const address = value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError("Enter your Harbourline work email address.");
      return;
    }
    setBusy(true);
    setError("");
    const found = await base44.entities.Employee.filter({ email: address });
    const list = Array.isArray(found) ? found : found?.items || [];
    const account = list[0];
    if (!account || account.role !== "admin") {
      signOut();
      setBusy(false);
      setError("Your account does not have access to the Sustainability Console.");
      return;
    }
    signIn({ email: address, role: "admin" });
    setBusy(false);
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-rule px-5 py-4 sm:px-10">
        <div className="flex items-center gap-4">
          <img src={IMG.logo} alt="CoffeeBot" className="h-9 w-auto" />
          <span className="h-7 w-px bg-rule" />
          <span className="text-[12px] uppercase tracking-[0.14em] text-sub">CoffeeBot Re · Sustainability Console</span>
        </div>
        <span className="flex h-6 items-center border border-rule px-2 text-[9px] tracking-[0.16em] text-sub">
          {HARBOURLINE_MARK}
        </span>
      </header>

      <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-10 px-5 py-12 lg:grid-cols-[1fr_420px] sm:px-10">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-sub">group sustainability · restricted</p>
          <h1 className="display mt-3 text-[46px] sm:text-[64px]">sustainability
            <br />console.</h1>
          <p className="mt-4 max-w-[46ch] text-[14px] leading-relaxed text-sub">
            Evidence, certificates and the monthly report for the CoffeeBot Re programme. Only Sustainability
            Admin accounts can enter. Employees and Floor Champions sign in on the programme page.
          </p>
          <ul className="mt-6 space-y-1.5 text-[12px] text-sub">
            <li>· Weighed collections and Champion-validated reuse records</li>
            <li>· Monthly floor certificates and the office ESG summary</li>
            <li>· Every change written to the audit log</li>
          </ul>
        </div>

        <div className="bg-paper p-6 shadow-[0_20px_50px_-30px_rgba(20,20,20,0.4)]">
          <h2 className="text-[16px] text-ink">Sign in to the console</h2>
          <p className="mt-1 text-[12px] text-sub">Harbourline Bank · Group Sustainability</p>
          <Pill
            className="mt-5 w-full"
            size="lg"
            onClick={() => attempt("sustainability.admin@harbourline-demo.com")}
            disabled={busy}
          >
            sign in with harbourline sso
          </Pill>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-rule" />
            <span className="text-[10px] uppercase tracking-[0.14em] text-sub">or work email</span>
            <span className="h-px flex-1 bg-rule" />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              attempt(email);
            }}
            className="space-y-3"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="name@harbourline.com"
              className="h-11 w-full border border-rule bg-white px-4 text-[13px] outline-none focus:border-ink"
            />
            {error && <p className="text-[12px] text-[#A44A3F]">{error}</p>}
            <Pill type="submit" variant="outline" className="w-full" disabled={busy}>
              {busy ? "checking access…" : "continue"}
            </Pill>
          </form>
          <p className="mt-5 border-t border-rule pt-3 text-[11px] leading-relaxed text-sub">
            Demo account: sustainability.admin@harbourline-demo.com ·{" "}
            <a href="/demo" className="underline decoration-rule underline-offset-4 hover:text-ink">all demo accounts</a>
          </p>
        </div>
      </div>
    </div>
  );
}
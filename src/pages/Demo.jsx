import { Link } from "react-router-dom";
import { IMG } from "@/lib/assets";
import Pill from "@/components/cb/Pill";

const ACCOUNTS = [
  { role: "Employee", email: "demo.employee@harbourline-demo.com", where: "L10 · Retail Operations", note: "Collect, reuse, share, see the floor ranking." },
  { role: "Floor Champion", email: "demo.champion@harbourline-demo.com", where: "L11 · Technology", note: "Validates L11 reuse records, sees proof photos, can challenge another floor." },
  { role: "Sustainability Admin", email: "sustainability.admin@harbourline-demo.com", where: "Group Sustainability", note: "Console at /admin · certificates, carbon module, settings, audit log." },
];

export default function Demo() {
  return (
    <div className="mx-auto max-w-[760px] py-8">
      <img src={IMG.logo} alt="CoffeeBot" className="h-8 w-auto" />
      <p className="mt-8 text-[11px] uppercase tracking-[0.18em] text-sub">hidden page · demo access</p>
      <h1 className="display mt-3 text-[52px] sm:text-[72px]">demo accounts.</h1>
      <p className="mt-4 text-[14px] leading-relaxed text-sub">
        Sign in with any of these work emails on the login page. No password is required in the pilot build.
        Roles cannot be changed from inside the app.
      </p>

      <div className="mt-8 divide-y divide-rule border-y border-rule">
        {ACCOUNTS.map((a) => (
          <div key={a.email} className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-[150px_1fr] sm:gap-6">
            <div className="text-[12px] uppercase tracking-[0.12em] text-sub">{a.role}</div>
            <div>
              <div className="select-all text-[15px] text-ink">{a.email}</div>
              <div className="mt-0.5 text-[12px] text-sub">{a.where}</div>
              <div className="mt-1 text-[12px] text-sub">{a.note}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Pill to="/login">employee and champion sign in</Pill>
        <Pill to="/admin/login" variant="outline">sustainability console</Pill>
        <Pill to="/about" variant="ghost">about the programme</Pill>
      </div>

      <p className="mt-8 text-[12px] leading-relaxed text-sub">
        Any other @harbourline-demo.com address creates a new employee profile on first sign-in, where you set
        your floor. <Link to="/login" className="underline decoration-rule underline-offset-4">Back to sign in</Link>
      </p>
    </div>
  );
}
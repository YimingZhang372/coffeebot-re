import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useProgramme } from "@/lib/programmeData";
import { FLOORS } from "@/lib/programme";
import Pill from "@/components/cb/Pill";
import { IMG } from "@/lib/assets";

export default function Welcome() {
  const { me, updateMe } = useProgramme();
  const [floor, setFloor] = useState(me?.floorCode || "L10");
  const [name, setName] = useState(me?.name || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter the name your floor will see.");
      return;
    }
    setBusy(true);
    const dept = FLOORS.find((f) => f.code === floor)?.name || "";
    await updateMe({ name: name.trim(), floorCode: floor, department: dept, profileSet: true });
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-[560px] py-10">
      <img src={IMG.logo} alt="CoffeeBot" className="h-9 w-auto" />
      <p className="mt-8 text-[11px] uppercase tracking-[0.18em] text-sub">first sign-in · profile setup</p>
      <h1 className="display mt-3 text-[48px] sm:text-[64px]">one floor, one department.</h1>
      <p className="mt-4 text-[14px] leading-relaxed text-sub">
        Your floor and department are fixed at first sign-in and cannot be changed by you. The Floor Champion
        for your floor validates your reuse records.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label className="block text-[11px] uppercase tracking-[0.16em] text-sub">full name</label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            className="mt-2 h-12 w-full rounded-full border border-rule bg-white px-5 text-[15px] outline-none focus:border-ink"
            placeholder="As it appears in the staff directory"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-[0.16em] text-sub">floor</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {FLOORS.map((f) => (
              <button
                key={f.code}
                type="button"
                onClick={() => setFloor(f.code)}
                className={`border px-3 py-3 text-left transition-colors ${
                  floor === f.code ? "border-ink bg-white" : "border-rule hover:border-ink"
                }`}
              >
                <span className="block text-[13px] text-ink">{f.code} · {f.name}</span>
                <span className="block text-[11px] text-sub">{f.eligible} eligible employees</span>
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-[12px] text-[#A44A3F]">{error}</p>}
        <Pill type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? "saving…" : "confirm floor and department"}
        </Pill>
      </form>
    </div>
  );
}
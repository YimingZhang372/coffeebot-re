import { useState } from "react";
import { useProgramme } from "@/lib/programmeData";
import { FLOORS, DOW_NAMES } from "@/lib/programme";
import Pill from "@/components/cb/Pill";

const OFFICES = [
  { id: "marina-bay", name: "Marina Bay", serviceDays: [1, 2, 3, 4, 5] },
  { id: "changi", name: "Changi Business Park", serviceDays: [2, 3, 4] },
  { id: "raffles", name: "Raffles Place", serviceDays: [1, 3, 4, 5] },
];

const isRecommended = (day) => [1, 2, 3].includes(day);

export default function AdminSettings() {
  const { settings, saveSettings, eligibleByFloor, config } = useProgramme();
  const [target, setTarget] = useState(settings?.participationTarget ?? 30);
  const [monthlyTarget, setMonthlyTarget] = useState(settings?.monthlyTargetKg ?? 6);
  const [prize, setPrize] = useState(settings?.prizeName || "");
  const [prizeType, setPrizeType] = useState(settings?.prizeType || "breakfast");
  const [eligible, setEligible] = useState(
    Object.fromEntries(FLOORS.map((f) => [f.code, eligibleByFloor[f.code] ?? f.eligible]))
  );
  const [schedules, setSchedules] = useState(() => {
    const base = settings?.officeSchedules || [];
    return Object.fromEntries(
      OFFICES.map((o) => {
        const found = base.find((b) => b.officeId === o.id);
        return [o.id, { day: found?.day ?? 2, time: found?.time || "10:00" }];
      })
    );
  });
  const [notice, setNotice] = useState("");
  const dt = (iso) => String(iso || "").slice(0, 16);
  const iso = (v) => (String(v || "").length === 16 ? `${v}:00+08:00` : v);
  const [pledgeForm, setPledgeForm] = useState(() => ({
    pledgeNightAt: dt(config.pledgeNightAt),
    finalBidOpenAt: dt(config.finalBidOpenAt),
    finalBidCloseAt: dt(config.finalBidCloseAt),
    monthCloseAt: dt(config.monthCloseAt),
    nextPledgeNightAt: dt(config.nextPledgeNightAt),
    met: config.multipliers.met,
    missed: config.multipliers.missed,
    finalMet: config.multipliers.finalMet,
    finalMissed: config.multipliers.finalMissed,
    capVolume: config.caps.volume,
    capUplift: config.caps.uplift,
  }));
  const setPledgeField = (key, value) => setPledgeForm((p) => ({ ...p, [key]: value }));

  const save = async () => {
    const marina = schedules["marina-bay"];
    await saveSettings(
      {
        participationTarget: Number(target),
        monthlyTargetKg: Number(monthlyTarget),
        prizeName: prize,
        prizeType,
        eligibleByFloor: FLOORS.map((f) => ({ floorCode: f.code, eligible: Number(eligible[f.code]) })),
        groundDropDay: Number(marina.day),
        groundDropTime: marina.time,
        clearOutDay: (Number(marina.day) + 2) % 7,
        officeSchedules: OFFICES.map((o) => ({
          officeId: o.id,
          day: Number(schedules[o.id].day),
          time: schedules[o.id].time,
          serviceDays: o.serviceDays,
        })),
        pledge: {
          pledgeNightAt: iso(pledgeForm.pledgeNightAt),
          finalBidOpenAt: iso(pledgeForm.finalBidOpenAt),
          finalBidCloseAt: iso(pledgeForm.finalBidCloseAt),
          monthCloseAt: iso(pledgeForm.monthCloseAt),
          nextPledgeNightAt: iso(pledgeForm.nextPledgeNightAt),
          multipliers: {
            met: Number(pledgeForm.met),
            missed: Number(pledgeForm.missed),
            finalMet: Number(pledgeForm.finalMet),
            finalMissed: Number(pledgeForm.finalMissed),
          },
          caps: { volume: Number(pledgeForm.capVolume), uplift: Number(pledgeForm.capUplift) },
        },
      },
      `Programme settings saved: target ${target}%, Marina Bay Ground Drop ${DOW_NAMES[Number(marina.day)]} ${marina.time}, final bid ${iso(pledgeForm.finalBidOpenAt)}, multipliers ${pledgeForm.met}/${pledgeForm.missed}/${pledgeForm.finalMet}/${pledgeForm.finalMissed}, caps ${pledgeForm.capVolume}/${pledgeForm.capUplift}.`
    );
    setNotice(`Saved. The Ground Drop day is now ${DOW_NAMES[Number(marina.day)]} for Marina Bay and the clear-out day is ${DOW_NAMES[(Number(marina.day) + 2) % 7]}.`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold">Programme settings</h1>
          <p className="text-[12px] text-sub">
            Changes apply immediately across the programme and are written to the audit log.
          </p>
        </div>
        <Pill size="sm" onClick={save}>save settings</Pill>
      </div>

      {notice && <div className="border border-verdant/40 bg-verdant/10 px-4 py-2 text-[12px] text-verdant">{notice}</div>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="border border-rule bg-paper p-4">
          <p className="text-[13px] font-medium">Targets and prize</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.12em] text-sub">participation target per floor</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="h-9 w-20 border border-rule bg-white px-2 text-[12px] tabular"
                />
                <span className="text-[12px] text-sub">%</span>
              </div>
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.12em] text-sub">monthly office target</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(e.target.value)}
                  className="h-9 w-20 border border-rule bg-white px-2 text-[12px] tabular"
                />
                <span className="text-[12px] text-sub">kg reused</span>
              </div>
            </label>
          </div>
          <label className="mt-3 block">
            <span className="text-[10px] uppercase tracking-[0.12em] text-sub">monthly prize</span>
            <input
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              className="mt-1 h-9 w-full border border-rule bg-white px-2 text-[12px]"
            />
          </label>
          <div className="mt-3 flex gap-2">
            {[["breakfast", "team breakfast"], ["donation", "charity donation"]].map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setPrizeType(k)}
                className={`rounded-full border px-3 py-1.5 text-[12px] lowercase ${
                  prizeType === k ? "border-ink bg-ink text-white" : "border-rule text-sub hover:border-ink"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-sub">
            Funded by the bank. No coffee vouchers, no cash, no individual points shop.
          </p>
        </div>

        <div className="border border-rule bg-paper p-4">
          <p className="text-[13px] font-medium">Eligible employees per floor</p>
          <div className="mt-3 space-y-1.5">
            {FLOORS.map((f) => (
              <div key={f.code} className="flex items-center justify-between">
                <span className="text-[12px] text-ink">{f.code} · {f.name}</span>
                <input
                  type="number"
                  value={eligible[f.code]}
                  onChange={(e) => setEligible({ ...eligible, [f.code]: e.target.value })}
                  className="h-8 w-20 border border-rule bg-white px-2 text-[12px] tabular"
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-sub">
            Total {Object.values(eligible).reduce((s, n) => s + Number(n || 0), 0)} eligible across six floors.
          </p>
        </div>
      </div>

      <div className="border border-rule bg-paper p-4">
        <p className="text-[13px] font-medium">Ground Drop day per office</p>
        <p className="mt-1 text-[12px] text-sub">
          Only days on which CoffeeBot services the site are selectable. The clear-out day is set automatically two
          days later.
        </p>
        <div className="mt-3 divide-y divide-rule">
          {OFFICES.map((o) => {
            const value = schedules[o.id];
            return (
              <div key={o.id} className="grid grid-cols-1 items-center gap-3 py-3 sm:grid-cols-[1fr_180px_140px_1fr]">
                <div>
                  <p className="text-[13px] text-ink">{o.name}</p>
                  <p className="text-[11px] text-sub">
                    clears out {DOW_NAMES[(Number(value.day) + 2) % 7]}
                  </p>
                </div>
                <select
                  value={value.day}
                  onChange={(e) => setSchedules({ ...schedules, [o.id]: { ...value, day: Number(e.target.value) } })}
                  className="h-9 border border-rule bg-white px-2 text-[12px]"
                >
                  {DOW_NAMES.map((name, idx) => {
                    const serviced = o.serviceDays.includes(idx);
                    return (
                      <option
                        key={name}
                        value={idx}
                        disabled={!serviced}
                        title={serviced ? (isRecommended(idx) ? "Recommended: wet grounds keep 2-3 days" : undefined) : "No CoffeeBot service visit on this day"}
                      >
                        {name}
                        {serviced && isRecommended(idx) ? " · recommended" : ""}
                        {!serviced ? " · no service" : ""}
                      </option>
                    );
                  })}
                </select>
                <input
                  type="time"
                  value={value.time}
                  onChange={(e) => setSchedules({ ...schedules, [o.id]: { ...value, time: e.target.value } })}
                  className="h-9 border border-rule bg-white px-2 text-[12px] tabular"
                />
                <p className="text-[11px] text-sub">
                  Service days: {o.serviceDays.map((d) => DOW_NAMES[d].slice(0, 3)).join(", ")}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-sub">
          Monday to Wednesday are recommended: wet grounds keep 2-3 days before the clear-out.
        </p>
      </div>

      <div className="border border-rule bg-paper p-4">
        <p className="text-[13px] font-medium">Pledge Auction</p>
        <p className="mt-1 text-[12px] text-sub">
          Pledge Night, the final bid window, the month close, the multipliers and the point caps. Every change is
          written to the audit log.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["pledgeNightAt", "Pledge Night"],
            ["finalBidOpenAt", "Final bid opens"],
            ["finalBidCloseAt", "Final bid closes"],
            ["monthCloseAt", "Month closes"],
            ["nextPledgeNightAt", "Next Pledge Night"],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-[10px] uppercase tracking-[0.12em] text-sub">{label}</span>
              <input
                type="datetime-local"
                value={pledgeForm[key]}
                onChange={(e) => setPledgeField(key, e.target.value)}
                className="mt-1 h-9 w-full border border-rule bg-white px-2 text-[12px] tabular"
              />
            </label>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            ["met", "× if bid met"],
            ["missed", "× if bid missed"],
            ["finalMet", "× final bid met"],
            ["finalMissed", "× final bid missed"],
            ["capVolume", "volume cap"],
            ["capUplift", "uplift cap"],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-[10px] uppercase tracking-[0.12em] text-sub">{label}</span>
              <input
                type="number"
                step="0.05"
                value={pledgeForm[key]}
                onChange={(e) => setPledgeField(key, e.target.value)}
                className="mt-1 h-9 w-full border border-rule bg-white px-2 text-[12px] tabular"
              />
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-sub">
          Volunteer leave: {config.volunteer.leaveAt} h = half a day, capped at {config.volunteer.monthlyCap} h a month
          and {config.volunteer.annualCap} h a year. Monthly hours export from the overview.
        </p>
      </div>

      <div className="flex justify-end">
        <Pill onClick={save}>save settings</Pill>
      </div>
    </div>
  );
}
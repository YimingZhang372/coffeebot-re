import { useMemo, useState } from "react";
import { useProgramme } from "@/lib/programmeData";
import Pill from "@/components/cb/Pill";
import StatusChip from "@/components/cb/StatusChip";

const SOURCE_COLOR = {
  CoffeeBot: "neutral",
  "DBS benchmark": "pending",
  "Our assumption": "draft",
  "Our rule": "draft",
};

const INPUTS = [
  {
    key: "gramsPerCoffee",
    group: "impacts",
    label: "Wet grounds per coffee",
    unit: "g",
    source: "CoffeeBot",
    reason: "Basket weight measured on the machine",
  },
  {
    key: "drinksPerMonth",
    group: "impacts",
    label: "Coffee-based drinks a month",
    unit: "drinks",
    source: "CoffeeBot",
    reason: "Machine data for Marina Bay",
  },
  {
    key: "workingDays",
    group: "impacts",
    label: "Working days a month",
    unit: "days",
    source: "Our assumption",
    reason: "Grounds per working day at the table",
  },
  {
    key: "participationTarget",
    group: "root",
    label: "Participation target per floor",
    unit: "%",
    source: "DBS benchmark",
    reason: "Over 20% of staff already volunteer",
  },
  {
    key: "hoursPerActivity",
    group: "volunteer",
    label: "Volunteer hours per validated activity",
    unit: "h",
    source: "Our rule",
    reason: "Agreed with HR for the pilot",
  },
];

/** Admin > How we calculate: the five inputs, their source, and the formula that follows. */
export default function AdminCalculations() {
  const { settings, config, saveSettings, eligibleByFloor } = useProgramme();
  const totalEligible = useMemo(
    () => Object.values(eligibleByFloor).reduce((s, n) => s + Number(n || 0), 0),
    [eligibleByFloor]
  );

  const [values, setValues] = useState(() => ({
    gramsPerCoffee: config.impacts.gramsPerCoffee,
    drinksPerMonth: config.impacts.drinksPerMonth,
    workingDays: config.impacts.workingDays,
    participationTarget: settings?.participationTarget ?? 30,
    hoursPerActivity: config.volunteer.hoursPerActivity,
  }));
  const [notice, setNotice] = useState("");

  const groundsKg = (Number(values.drinksPerMonth) * Number(values.gramsPerCoffee)) / 1000;
  const perEmployee = Math.round((Number(values.drinksPerMonth) * Number(values.gramsPerCoffee)) / Math.max(1, totalEligible));

  const save = async () => {
    await saveSettings(
      {
        impacts: {
          gramsPerCoffee: Number(values.gramsPerCoffee),
          drinksPerMonth: Number(values.drinksPerMonth),
          workingDays: Number(values.workingDays),
        },
        participationTarget: Number(values.participationTarget),
        volunteer: { ...config.volunteer, hoursPerActivity: Number(values.hoursPerActivity) },
      },
      `Calculation inputs changed: ${values.gramsPerCoffee} g per coffee, ${values.drinksPerMonth} drinks a month, ${values.workingDays} working days, ${values.participationTarget}% participation target, ${values.hoursPerActivity} h per activity.`
    );
    setNotice("Inputs saved. Every KPI, pledge score and certificate now recalculates from them.");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold">How we calculate</h1>
          <p className="text-[12px] text-sub">
            Five inputs drive every figure in the programme. Each carries its source and a one-line reason.
          </p>
        </div>
        <Pill size="sm" onClick={save}>save inputs</Pill>
      </div>

      {notice && <div className="border border-verdant/40 bg-verdant/10 px-4 py-2 text-[12px] text-verdant">{notice}</div>}

      <div className="border border-rule bg-paper p-4">
        <p className="text-[13px] font-medium">Inputs</p>
        <table className="mt-3 w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {["Input", "Value", "Source", "Why"].map((h) => (
                <th key={h} className="border-b border-rule py-2 text-left text-[10px] uppercase tracking-[0.12em] text-sub">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INPUTS.map((i) => (
              <tr key={i.key} className="border-b border-rule/60">
                <td className="py-2 pr-3 text-ink">{i.label}</td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={i.key === "gramsPerCoffee" ? "0.5" : "1"}
                      value={values[i.key]}
                      onChange={(e) => setValues((v) => ({ ...v, [i.key]: e.target.value }))}
                      className="h-8 w-24 border border-rule bg-white px-2 text-[12px] tabular outline-none focus:border-ink"
                    />
                    <span className="text-sub">{i.unit}</span>
                  </div>
                </td>
                <td className="py-2 pr-3">
                  <StatusChip status={SOURCE_COLOR[i.source] || "neutral"}>{i.source}</StatusChip>
                </td>
                <td className="py-2 text-sub">{i.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border border-rule bg-paper p-4">
        <p className="text-[13px] font-medium">The formula</p>
        <ol className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-ink">
          <li>
            <span className="text-sub">Monthly grounds · </span>
            {values.drinksPerMonth} drinks × {values.gramsPerCoffee} g = {groundsKg.toFixed(1)} kg of wet grounds a month.
          </li>
          <li>
            <span className="text-sub">Per employee · </span>
            {groundsKg.toFixed(1)} kg ÷ {totalEligible} eligible employees = {perEmployee} g per employee per month.
          </li>
          <li>
            <span className="text-sub">Volume points · </span>
            g reused per employee ÷ {perEmployee} g × 100, capped at {config.caps.volume}.
          </li>
          <li>
            <span className="text-sub">Uplift points · </span>
            (this month − baseline) ÷ baseline × {config.multipliers.met} if the bid is met, ×{" "}
            {config.multipliers.missed} if missed; × {config.multipliers.finalMet} / {config.multipliers.finalMissed} after a
            final bid. Capped at {config.caps.uplift}, never below 0.
          </li>
          <li>
            <span className="text-sub">Score · </span>
            volume + uplift out of {config.caps.volume + config.caps.uplift}.
          </li>
          <li>
            <span className="text-sub">Impact translator · </span>
            every gram figure is also shown as coffees: grams ÷ {values.gramsPerCoffee} g per coffee, or ÷ (floor
            headcount × {values.gramsPerCoffee} g) for working days of a floor&rsquo;s coffee.
          </li>
          <li>
            <span className="text-sub">Volunteer time · </span>
            1 validated activity = {values.hoursPerActivity} h, capped at {config.volunteer.monthlyCap} h a month and{" "}
            {config.volunteer.annualCap} h a year; {config.volunteer.leaveAt} h earns half a day of volunteer leave.
          </li>
        </ol>
        <p className="mt-3 text-[11px] text-sub">
          Changing an input recalculates the pledge board, the leaderboard, the impact translator and every certificate
          in the same pass. Every save is written to the audit log.
        </p>
      </div>
    </div>
  );
}
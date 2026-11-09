import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line,
} from "recharts";
import { useProgramme } from "@/lib/programmeData";
import { activityByKey, formatSgt, monthLabel } from "@/lib/programme";
import AdminKpi from "@/components/admin/AdminKpi";
import AdminTable from "@/components/admin/AdminTable";
import { downloadCsv } from "@/lib/csv";

export default function AdminOverview() {
  const { rows, office, prevOffice, reuses, collections, month, settings, employees, config } = useProgramme();
  const target = settings?.participationTarget ?? 30;

  const hoursRows = useMemo(() => {
    const byEmail = {};
    reuses
      .filter((r) => r.status === "validated" && r.occurredAt.slice(0, 7) === month && r.employeeEmail)
      .forEach((r) => {
        byEmail[r.employeeEmail] = (byEmail[r.employeeEmail] || 0) + 1;
      });
    return Object.entries(byEmail)
      .map(([email, count]) => {
        const emp = employees.find((e) => e.email === email);
        return {
          floor: emp?.floorCode || "—",
          employeeRef: emp?.refId || "—",
          activities: count,
          hours: Math.min(config.volunteer.monthlyCap, count * config.volunteer.hoursPerActivity),
          email,
        };
      })
      .sort((a, b) => b.hours - a.hours);
  }, [reuses, employees, month, config]);

  const exportHours = () =>
    downloadCsv(`coffeebot-volunteer-hours-${month}.csv`, hoursRows, [
      { label: "Floor", value: (r) => r.floor },
      { label: "Employee reference", value: (r) => r.employeeRef },
      { label: "Validated activities", value: (r) => r.activities },
      { label: "Volunteer hours", value: (r) => r.hours.toFixed(1) },
      { label: "Month", value: () => month },
    ]);

  const monthly = useMemo(() => {
    const map = {};
    reuses.filter((r) => r.status === "validated").forEach((r) => {
      const k = r.occurredAt.slice(0, 7);
      map[k] = (map[k] || 0) + r.grams;
    });
    return Object.entries(map)
      .sort()
      .map(([k, g]) => ({ month: monthLabel(k).slice(0, 3), kg: Number((g / 1000).toFixed(2)) }));
  }, [reuses]);

  const byActivity = useMemo(() => {
    const map = {};
    reuses.filter((r) => r.status === "validated").forEach((r) => {
      map[r.activityKey] = (map[r.activityKey] || 0) + 1;
    });
    return Object.entries(map).map(([k, count]) => ({ name: activityByKey(k).name, count }));
  }, [reuses]);

  const delta = prevOffice.reused ? ((office.reused - prevOffice.reused) / prevOffice.reused) * 100 : 0;

  const results = rows.map((r) => ({
    ...r,
    collectedKg: Number((r.collected / 1000).toFixed(2)),
    reusedKg: Number((r.reused / 1000).toFixed(2)),
    ratePct: Number(r.reuseRate.toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold">Overview</h1>
          <p className="text-[12px] text-sub">
            Marina Bay · {monthLabel(month)} · last updated {formatSgt(new Date())}
          </p>
        </div>
        <p className="text-[11px] uppercase tracking-[0.12em] text-sub">
          {employees.filter((e) => e.office === "Marina Bay").length} employees on record
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminKpi label="kg diverted from disposal" value={office.diverted / 1000} decimals={2} unit="kg" change={delta} primary note="GRI 306-4" />
        <AdminKpi label="kg collected" value={office.collected / 1000} decimals={2} unit="kg" note="weighed at collection" />
        <AdminKpi label="reuse rate" value={office.reuseRate} decimals={1} unit="%" note="reused ÷ collected" />
        <AdminKpi label="participating employees" value={office.participants} unit={`of ${office.eligible}`} note={`${Math.round(office.participation)}% of eligible`} />
        <AdminKpi label={`floors above ${target}%`} value={office.aboveTarget} unit="of 6" note="participation target" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="border border-rule bg-paper p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-sub">kg diverted by month</p>
          <div className="mt-3 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid stroke="#E2DEDA" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6E6A66" }} axisLine={{ stroke: "#CFCBC6" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6E6A66" }} axisLine={false} tickLine={false} unit=" kg" width={52} />
                <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #CFCBC6", borderRadius: 2 }} />
                <Line type="monotone" dataKey="kg" stroke="#141414" strokeWidth={1.6} dot={{ r: 3, fill: "#5E7D5A" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-rule bg-paper p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-sub">participation by floor · % of eligible</p>
          <div className="mt-3 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows.map((r) => ({ floor: r.code, pct: Number(r.participation.toFixed(1)) }))}>
                <CartesianGrid stroke="#E2DEDA" vertical={false} />
                <XAxis dataKey="floor" tick={{ fontSize: 11, fill: "#6E6A66" }} axisLine={{ stroke: "#CFCBC6" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6E6A66" }} axisLine={false} tickLine={false} unit="%" width={44} />
                <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #CFCBC6", borderRadius: 2 }} />
                <Bar dataKey="pct" fill="#5E7D5A" radius={[1, 1, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-rule bg-paper p-4 xl:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.12em] text-sub">activities by type · validated reuses</p>
          <div className="mt-3 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byActivity} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#E2DEDA" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6E6A66" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6E6A66" }} axisLine={false} tickLine={false} width={130} />
                <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #CFCBC6", borderRadius: 2 }} />
                <Bar dataKey="count" radius={[0, 1, 1, 0]}>
                  {byActivity.map((entry, i) => (
                    <Cell key={entry.name} fill={["#141414", "#5E7D5A", "#B9875A", "#8C8781", "#C9C5C0"][i % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="border border-rule bg-paper p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[13px] font-medium">Volunteer hours · {monthLabel(month)}</p>
            <p className="text-[12px] text-sub">
              1 validated activity = {config.volunteer.hoursPerActivity} h, capped at {config.volunteer.monthlyCap} h a
              month. The export feeds the bank&rsquo;s volunteer system.
            </p>
          </div>
          <button
            type="button"
            onClick={exportHours}
            className="rounded-full border border-rule px-3 py-1 text-[11px] lowercase text-sub transition-colors hover:border-ink hover:text-ink"
          >
            export monthly csv
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-px bg-rule sm:grid-cols-4">
          {[
            ["colleagues with hours", hoursRows.length],
            ["hours this month", hoursRows.reduce((s, r) => s + r.hours, 0).toFixed(1)],
            ["activities validated", hoursRows.reduce((s, r) => s + r.activities, 0)],
            ["at half a day leave", `${config.volunteer.leaveAt} h`],
          ].map(([label, value]) => (
            <div key={label} className="bg-canvas px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-sub">{label}</p>
              <p className="mt-1 text-[18px] tabular text-ink">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-rule bg-paper p-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium">Results by floor · {monthLabel(month)}</p>
          <p className="text-[11px] text-sub">export for the ESG report</p>
        </div>
        <div className="mt-3">
          <AdminTable
            exportName={`coffeebot-results-${month}.csv`}
            rows={results}
            initialSort={{ key: "reusedKg", dir: "desc" }}
            columns={[
              { key: "rank", label: "Rank", width: 60 },
              { key: "code", label: "Floor", width: 70 },
              { key: "name", label: "Department" },
              { key: "eligible", label: "Eligible", align: "right" },
              { key: "participants", label: "Participating", align: "right" },
              { key: "participation", label: "Participation %", align: "right", render: (r) => r.participation.toFixed(1) },
              { key: "collectedKg", label: "Collected kg", align: "right", render: (r) => r.collectedKg.toFixed(2) },
              { key: "reusedKg", label: "Reused kg", align: "right", render: (r) => r.reusedKg.toFixed(2) },
              { key: "reuseRate", label: "Reuse rate %", align: "right", render: (r) => r.ratePct.toFixed(1) },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
import { useMemo, useState } from "react";
import { useProgramme } from "@/lib/programmeData";
import { monthOf } from "@/lib/metrics";
import AdminTable from "@/components/admin/AdminTable";
import StatusChip from "@/components/cb/StatusChip";
import { groundDropState } from "@/lib/groundDrop";
import { formatSgt } from "@/lib/programme";

const OFFICE_SCHEDULES = [
  { office: "Marina Bay", day: "Tuesday", time: "10:00", clear: "Thursday", service: "Monday to Friday" },
  { office: "Changi Business Park", day: "Wednesday", time: "10:30", clear: "Friday", service: "Tuesday to Thursday" },
  { office: "Raffles Place", day: "Thursday", time: "09:30", clear: "Saturday", service: "Monday, Wednesday, Thursday, Friday" },
];

export default function AdminTables() {
  const { collections, settings, eligibleByFloor } = useProgramme();
  const st = groundDropState(settings);
  const [office, setOffice] = useState("Marina Bay");

  const rows = useMemo(() => {
    const floors = ["L8", "L9", "L10", "L11", "L12", "L14"];
    return floors.map((code) => {
      const since = collections.filter(
        (c) => c.floorCode === code && new Date(c.occurredAt) >= new Date(st.nextDrop.getTime() - 7 * 86400000)
      );
      const taken = since.reduce((s, c) => s + c.grams, 0);
      const stock = Math.max(0, 900 - taken);
      const status = stock > 320 ? "Available" : stock > 120 ? "Running low" : "Empty";
      const last = since.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))[0];
      return {
        id: code,
        code,
        eligible: eligibleByFloor[code],
        stock,
        taken,
        status,
        lastAt: last?.occurredAt,
        lastGrams: last?.grams,
        table: `${code} collection table`,
      };
    });
  }, [collections, st.nextDrop, eligibleByFloor]);

  const schedule = groundDropState(settings);
  const monthCollection = collections.filter((c) => monthOf(c.occurredAt) === monthOf(new Date().toISOString()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold">Collection tables</h1>
        <p className="text-[12px] text-sub">
          Weighed stock per floor and the Ground Drop schedule. Stock is estimated from grounds produced on the last
          drop minus what employees have weighed and taken.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="border border-rule bg-paper px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-sub">next ground drop</p>
          <p className="mt-1 text-[15px] text-ink">{schedule.nextLabel} · {schedule.time}</p>
        </div>
        <div className="border border-rule bg-paper px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-sub">clear-out day</p>
          <p className="mt-1 text-[15px] text-ink">{schedule.clearOutLabel}</p>
        </div>
        <div className="border border-rule bg-paper px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-sub">records this month</p>
          <p className="mt-1 text-[15px] tabular text-ink">{monthCollection.length}</p>
        </div>
      </div>

      <div className="border border-rule bg-paper p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-medium">Weighed stock per floor</p>
          <select value={office} onChange={(e) => setOffice(e.target.value)} className="ml-auto h-8 border border-rule bg-white px-2 text-[12px]">
            {["Marina Bay", "Changi Business Park", "Raffles Place"].map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <AdminTable
          exportName="coffeebot-collection-tables.csv"
          rows={office === "Marina Bay" ? rows : []}
          emptyLabel="No collection tables recorded for this office yet."
          columns={[
            { key: "code", label: "Floor", width: 70 },
            { key: "table", label: "Collection table" },
            { key: "eligible", label: "Eligible", align: "right" },
            { key: "stock", label: "Stock (g)", align: "right" },
            { key: "taken", label: "Taken since last drop (g)", align: "right" },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <StatusChip status={r.status === "Available" ? "validated" : r.status === "Running low" ? "pending" : "neutral"}>
                  {r.status}
                </StatusChip>
              ),
            },
            {
              key: "lastAt",
              label: "Last weighed",
              render: (r) => (r.lastAt ? `${r.lastGrams} g · ${formatSgt(r.lastAt)}` : "—"),
            },
          ]}
        />
      </div>

      <div className="border border-rule bg-paper p-4">
        <p className="text-[13px] font-medium">Ground Drop schedule by office</p>
        <table className="mt-3 w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {["Office", "Ground Drop", "Clear-out", "CoffeeBot service days"].map((h) => (
                <th key={h} className="border-b border-rule py-2 pr-3 text-left text-[10px] uppercase tracking-[0.12em] text-sub">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OFFICE_SCHEDULES.map((s) => (
              <tr key={s.office} className="h-10 border-b border-rule/60">
                <td>{s.office}</td>
                <td className="tabular">{s.day} · {s.time}</td>
                <td className="tabular">{s.clear}</td>
                <td className="text-sub">{s.service}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-sub">
          The clear-out day is set automatically two days after the Ground Drop. Leftovers go to normal waste.
        </p>
      </div>
    </div>
  );
}
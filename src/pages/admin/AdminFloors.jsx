import { useProgramme } from "@/lib/programmeData";
import AdminTable from "@/components/admin/AdminTable";
import StatusChip from "@/components/cb/StatusChip";

export default function AdminFloors() {
  const { rows, employees, eligibleByFloor, target } = useProgramme();

  const data = rows.map((r) => {
    const roster = employees.filter((e) => e.floorCode === r.code && e.role !== "admin");
    const champion = roster.find((e) => e.role === "champion");
    return {
      ...r,
      champion: champion?.name || "vacant",
      championEmail: champion?.email || "—",
      headcount: roster.length,
      active: roster.filter((e) => e.activeMember).length,
      eligible: eligibleByFloor[r.code] || r.eligible,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold">Floors</h1>
        <p className="text-[12px] text-sub">
          Six programme floors at Marina Bay. One named Floor Champion per floor validates reuse records. No L13.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {data.map((f) => (
          <div key={f.code} className="border border-rule bg-paper p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[18px] font-semibold leading-none">{f.code}</p>
                <p className="mt-1 text-[13px] text-ink">{f.name}</p>
              </div>
              <StatusChip status={f.participation >= target ? "validated" : "neutral"}>
                {f.participation >= target ? "above target" : "below target"}
              </StatusChip>
            </div>
            <dl className="mt-3 space-y-1.5 text-[12px]">
              <div className="flex justify-between"><dt className="text-sub">Floor Champion</dt><dd className="text-ink">{f.champion}</dd></div>
              <div className="flex justify-between"><dt className="text-sub">Eligible employees</dt><dd className="tabular text-ink">{f.eligible}</dd></div>
              <div className="flex justify-between"><dt className="text-sub">On record</dt><dd className="tabular text-ink">{f.headcount} ({f.active} active)</dd></div>
              <div className="flex justify-between"><dt className="text-sub">Participation</dt><dd className="tabular text-ink">{f.participation.toFixed(1)}%</dd></div>
              <div className="flex justify-between"><dt className="text-sub">Rank</dt><dd className="tabular text-ink">{f.rank} of 6</dd></div>
            </dl>
            <div className="mt-3 h-[3px] w-full bg-rule">
              <span className="block h-[3px] bg-verdant" style={{ width: `${Math.min(100, f.participation * 2)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="border border-rule bg-paper p-4">
        <p className="text-[13px] font-medium">Floor results</p>
        <div className="mt-3">
          <AdminTable
            exportName="coffeebot-floors.csv"
            rows={data}
            columns={[
              { key: "code", label: "Floor", width: 70 },
              { key: "name", label: "Department" },
              { key: "champion", label: "Champion" },
              { key: "eligible", label: "Eligible", align: "right" },
              { key: "participants", label: "Participating", align: "right" },
              { key: "posts", label: "Validated posts", align: "right" },
              { key: "reused", label: "Reused (g)", align: "right" },
              { key: "perEmployee", label: "g per employee", align: "right", render: (r) => Math.round(r.perEmployee) },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
import { useMemo, useState } from "react";
import { downloadCsv } from "@/lib/csv";

export default function AdminTable({
  columns,
  rows,
  pageSize = 12,
  exportName = "export.csv",
  emptyLabel = "No records match these filters.",
  onRowClick,
  initialSort,
}) {
  const [sortKey, setSortKey] = useState(initialSort?.key || "");
  const [dir, setDir] = useState(initialSort?.dir || "desc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    const get = col?.sortValue || ((r) => r[sortKey]);
    return [...rows].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (av === bv) return 0;
      const out = av > bv ? 1 : -1;
      return dir === "asc" ? out : -out;
    });
  }, [rows, sortKey, dir, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages - 1);
  const slice = sorted.slice(current * pageSize, current * pageSize + pageSize);

  const toggle = (key) => {
    if (sortKey === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDir("desc");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <span className="text-[11px] uppercase tracking-[0.12em] text-sub">
          {sorted.length} {sorted.length === 1 ? "record" : "records"}
        </span>
        <button
          type="button"
          onClick={() =>
            downloadCsv(
              exportName,
              sorted,
              columns.map((c) => ({ label: c.label, value: c.csv || ((r) => r[c.key]) }))
            )
          }
          className="rounded-full border border-rule px-3 py-1 text-[11px] lowercase text-sub transition-colors hover:border-ink hover:text-ink"
        >
          export csv
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => !c.noSort && toggle(c.key)}
                  className={`whitespace-nowrap border-b border-rule py-2 pr-3 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-sub ${
                    c.noSort ? "" : "cursor-pointer hover:text-ink"
                  } ${c.align === "right" ? "text-right" : ""}`}
                  style={{ width: c.width }}
                >
                  {c.label}
                  {sortKey === c.key && <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => (
              <tr
                key={r.id || i}
                onClick={() => onRowClick?.(r)}
                className={`h-10 border-b border-rule/60 text-[12px] text-ink ${onRowClick ? "cursor-pointer hover:bg-white/70" : ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`py-2 pr-3 align-middle ${c.align === "right" ? "text-right tabular" : ""}`}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
            {!slice.length && (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-[12px] text-sub">
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-sub">
        <span>
          page {current + 1} of {pages}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
            className="rounded-full border border-rule px-3 py-1 disabled:opacity-40 hover:border-ink"
          >
            previous
          </button>
          <button
            type="button"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
            className="rounded-full border border-rule px-3 py-1 disabled:opacity-40 hover:border-ink"
          >
            next
          </button>
        </div>
      </div>
    </div>
  );
}
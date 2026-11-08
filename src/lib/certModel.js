import { floorByCode } from "./programme";

/** Shared certificate shape for the on-screen preview and the PDF, so both always match. */
export function certMeta(cert) {
  const isOffice = cert.type === "office";
  return {
    isOffice,
    kicker: isOffice ? "office esg summary certificate" : "floor certificate",
    title: isOffice ? "Marina Bay · all floors" : `${cert.floorCode} · ${floorByCode(cert.floorCode).name}`,
    subtitle: `${cert.office} · ${cert.periodLabel} · GRI 306-4 Waste diverted from disposal, preparation for reuse`,
    signatures: [
      { name: "Adrian Koh", title: "Operations Lead, CoffeeBot Pte Ltd", date: cert.issuedAt },
      { name: "Sarah Wee", title: "Head of Sustainability, Harbourline Bank", date: cert.issuedAt },
    ],
  };
}

/** Table rows: measure / value / evidence, each carrying an evidence chip. */
export function certRows(cert) {
  const kgCollected = `${Number(cert.kgCollected || 0).toFixed(2)} kg`;
  const kgReused = `${Number(cert.kgReused || 0).toFixed(2)} kg`;
  const [nextValue, nextBasis] = String(cert.nextTarget || "—").split(" · ");
  const rows = [
    {
      measure: "Kg wet grounds collected",
      value: kgCollected,
      evidence: "Weighed at the collection table on every Ground Drop day",
      chip: "Weighed",
    },
    {
      measure: "Kg grounds reused",
      value: kgReused,
      evidence: "Reported by employees, validated by the Floor Champion",
      chip: "Validated",
    },
    {
      measure: "Reuse rate",
      value: `${Number(cert.reuseRate || 0).toFixed(1)}%`,
      evidence: "Reused ÷ collected for the period",
      chip: "Reported",
    },
  ];

  if (cert.type === "office") {
    rows.push({
      measure: "Office rank (Harbourline)",
      value: `${cert.rank || 1} of 3`,
      evidence: "Marina Bay, Changi Business Park and Raffles Place",
      chip: "Reported",
    });
  } else {
    rows.push({
      measure: "Floor rank (Marina Bay)",
      value: cert.rank ? `${cert.rank} of 6` : "—",
      evidence: "g reused per employee across the six Marina Bay floors",
      chip: "Reported",
    });
  }

  rows.push({
    measure: "GRI 306-4 Waste diverted from disposal, preparation for reuse",
    value: kgReused,
    evidence: "Figure carried into the Group Sustainability ESG report",
    chip: "Validated",
  });
  rows.push({
    measure: "Next target",
    value: nextValue || "—",
    evidence: nextBasis || "Set by Group Sustainability",
    chip: "Reported",
  });

  return rows;
}
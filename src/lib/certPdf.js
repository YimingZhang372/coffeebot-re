import { jsPDF } from "jspdf";
import { IMG } from "./assets";
import { formatSgt } from "./programme";

const INK = [20, 20, 20];
const SUB = [110, 106, 102];
const RULE = [207, 203, 198];
const CARAMEL = [185, 135, 90];
const GREEN = [94, 125, 90];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function prng(seed) {
  let a = seed;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawBarcode(doc, id, x, y, w, h) {
  const rand = prng(hash(id));
  let cursor = x;
  let i = 0;
  while (cursor < x + w - 1) {
    const barW = rand() > 0.72 ? 0.9 : rand() > 0.4 ? 0.55 : 0.3;
    if (i % 2 === 0) {
      doc.setFillColor(...INK);
      doc.rect(cursor, y, barW, h, "F");
    }
    cursor += barW + 0.35;
    i += 1;
  }
  doc.setFontSize(6);
  doc.setTextColor(...SUB);
  doc.text(id, x, y + h + 3);
}

/** Deterministic verification matrix — encodes the certificate ID string. */
function drawVerificationMatrix(doc, id, x, y, size = 20) {
  const cells = 21;
  const cell = size / cells;
  const rand = prng(hash(`verify-${id}`));
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, size, size, "F");
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const finder =
        (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
      if (finder) continue;
      if (rand() > 0.52) {
        doc.setFillColor(...INK);
        doc.rect(x + c * cell, y + r * cell, cell, cell, "F");
      }
    }
  }
  const eye = (ox, oy) => {
    doc.setFillColor(...INK);
    doc.rect(ox, oy, cell * 7, cell * 7, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(ox + cell, oy + cell, cell * 5, cell * 5, "F");
    doc.setFillColor(...INK);
    doc.rect(ox + cell * 2, oy + cell * 2, cell * 3, cell * 3, "F");
  };
  eye(x, y);
  eye(x + cell * (cells - 7), y);
  eye(x, y + cell * (cells - 7));
}

async function tryImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve({ data: canvas.toDataURL("image/png"), w: img.width, h: img.height });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    setTimeout(() => resolve(null), 2500);
    img.src = url;
  });
}

async function header(doc, pageW, title) {
  const logo = await tryImage(IMG.logo);
  if (logo) {
    const h = 9;
    const w = (logo.w / logo.h) * h;
    try {
      doc.addImage(logo.data, "PNG", 18, 12, w, h);
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...INK);
      doc.text("CoffeeBot", 18, 19);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...INK);
    doc.text("CoffeeBot", 18, 19);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...SUB);
  doc.text("COFFEEBOT OPERATIONS · SINGAPORE", 18, 25);

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.rect(pageW - 78, 13, 60, 11);
  doc.setFontSize(7.5);
  doc.setTextColor(...INK);
  doc.text("HARBOURLINE BANK", pageW - 72, 20);

  doc.setFontSize(7);
  doc.setTextColor(...SUB);
  doc.text(title, pageW - 78, 31);
}

export async function downloadCertificate(cert, opts = {}) {
  const isEmployee = cert.type === "employee";
  const doc = new jsPDF({ orientation: isEmployee ? "portrait" : "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = 18;
  const right = pageW - 18;
  const usable = right - left;

  await header(doc, pageW, isEmployee ? "Employee certificate" : "Sustainability certificate");

  // ---- title block, above the table, never inside it ----
  let y = 42;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...SUB);
  doc.text(
    cert.type === "office" ? "OFFICE ESG SUMMARY CERTIFICATE" : isEmployee ? "EMPLOYEE CERTIFICATE" : "FLOOR CERTIFICATE",
    left,
    y
  );
  y += 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(isEmployee ? 18 : 21);
  doc.setTextColor(...INK);
  const heading =
    cert.type === "office"
      ? `Marina Bay · all floors`
      : isEmployee
      ? opts.employeeName || "Employee"
      : `${cert.floorCode} · ${opts.floorName || ""}`.trim();
  doc.text(heading, left, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...SUB);
  doc.text(
    `${cert.office} · ${cert.periodLabel} · GRI 306-4 Waste diverted from disposal — preparation for reuse`,
    left,
    y
  );
  y += 5;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.4);
  doc.line(left, y, right, y);

  // ---- table: 30 / 25 / 45 ----
  const gap = 6;
  const colMeasure = usable * 0.3 - gap;
  const colValue = usable * 0.25 - gap;
  const colEvidence = usable * 0.45 - gap;
  const xMeasure = left;
  const xValue = left + usable * 0.3;
  const xEvidence = left + usable * 0.55;

  y += 8;
  doc.setFontSize(7);
  doc.setTextColor(...SUB);
  doc.text("MEASURE", xMeasure, y);
  doc.text("VALUE", xValue, y);
  doc.text("EVIDENCE / BASIS", xEvidence, y);
  y += 3;
  doc.line(left, y, right, y);
  y += 6;

  const rate = Number.isFinite(cert.reuseRate) ? `${cert.reuseRate.toFixed(1)}%` : "—";
  const rows = isEmployee
    ? [
        ["Kg wet grounds collected", `${Number(cert.kgCollected || 0).toFixed(2)} kg`, "Weighed at the floor collection table by the employee"],
        ["Kg grounds reused", `${Number(cert.kgReused || 0).toFixed(2)} kg`, "Reported by the employee · validated by the Floor Champion"],
        ["Reuse rate", rate, "Reused ÷ collected for the quarter"],
        ["Activities completed", String(cert.activitiesDone || 0), "Validated reuse records in the quarter"],
        ["Volunteering hours earned", `${Number(cert.volunteeringHours || 0).toFixed(1)} h`, "1 validated activity = 0.5 h, per programme rules"],
        ["Next quarter target", cert.nextTarget || "—", "Set by Group Sustainability"],
      ]
    : [
        ["Kg wet grounds collected", `${Number(cert.kgCollected || 0).toFixed(2)} kg`, "Weighed at the collection table on each Ground Drop day"],
        ["Kg grounds reused", `${Number(cert.kgReused || 0).toFixed(2)} kg`, "Reported by employees · validated by the Floor Champion"],
        ["Reuse rate", rate, "Reused ÷ collected for the period"],
        ["Rank", cert.rank ? `${cert.rank} of 6` : "—", "kg reused per employee, all Marina Bay floors"],
        ["Next target", (cert.nextTarget || "").split(" · ")[0] || "—", "Set by Group Sustainability for November 2026"],
        ["Avoided emissions", "Methodology pending", "Not reported for this period"],
      ];

  const lineH = 4.2;
  rows.forEach((row) => {
    const measureLines = doc.splitTextToSize(row[0], colMeasure);
    const valueLines = doc.splitTextToSize(row[1], colValue);
    const evidenceLines = doc.splitTextToSize(row[2], colEvidence);
    const lines = Math.max(measureLines.length, valueLines.length, evidenceLines.length);
    const rowH = lines * lineH + 5;

    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(measureLines, xMeasure, y);
    doc.setFont("helvetica", "bold");
    doc.text(valueLines, xValue, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(...SUB);
    doc.text(evidenceLines, xEvidence, y);

    y += rowH;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.2);
    doc.line(left, y - 3.5, right, y - 3.5);
    void rowH;
  });

  // ---- signatures ----
  const sigY = Math.min(pageH - 42, y + 10);
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  doc.line(left, sigY, left + 62, sigY);
  doc.line(pageW / 2 - 31, sigY, pageW / 2 + 31, sigY);

  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text("CoffeeBot Operations", left, sigY + 5);
  doc.setFontSize(7);
  doc.setTextColor(...SUB);
  doc.text("Authorised on behalf of CoffeeBot Pte Ltd", left, sigY + 9);

  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text("Head of Sustainability, Harbourline Bank", pageW / 2 - 31, sigY + 5);
  doc.setFontSize(7);
  doc.setTextColor(...SUB);
  doc.text(`Issued ${cert.issuedAt ? formatSgt(cert.issuedAt) : "—"}`, pageW / 2 - 31, sigY + 9);

  // ---- verification block, bottom right ----
  const vx = right - 62;
  drawVerificationMatrix(doc, cert.certId, vx, pageH - 46, 18);
  doc.setFontSize(6.5);
  doc.setTextColor(...SUB);
  doc.text("Scan to verify", vx, pageH - 25);
  doc.setFontSize(7.5);
  doc.setTextColor(...INK);
  doc.text(cert.certId, vx, pageH - 20);
  doc.setFontSize(6.5);
  doc.setTextColor(...SUB);
  doc.text(`/verify/${cert.certId}`, vx, pageH - 16);

  drawBarcode(doc, cert.certId, vx - 58, pageH - 44, 52, 12);

  doc.setFontSize(6.5);
  doc.setTextColor(...SUB);
  doc.text("CoffeeBot Re v2.3 · Evidence levels: Weighed / Reported / Validated", left, pageH - 14);
  if (cert.type !== "employee") {
    doc.text("Avoided emissions: methodology pending", left, pageH - 10);
  }

  doc.save(`${cert.certId}.pdf`);
}

export function buildFloorCert({ floorCode, floorName, office, period, periodLabel, rows, rank, certId, status, issuedAt }) {
  const collected = rows.collected / 1000;
  const reused = rows.reused / 1000;
  return {
    certId: certId || `CB-FLR-${period}-${floorCode}`,
    type: "floor",
    period,
    periodLabel,
    office,
    floorCode,
    floorName,
    kgCollected: Number(collected.toFixed(2)),
    kgReused: Number(reused.toFixed(2)),
    reuseRate: rows.collected ? Number(((rows.reused / rows.collected) * 100).toFixed(1)) : 0,
    rank,
    nextTarget: `${(reused * 1.15).toFixed(2)} kg reused · Set by Group Sustainability for November 2026`,
    status: status || "draft",
    issuedAt: issuedAt || "",
    activitiesDone: rows.posts || 0,
    volunteeringHours: (rows.posts || 0) * 0.5,
  };
}
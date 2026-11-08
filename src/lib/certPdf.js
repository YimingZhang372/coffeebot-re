import { jsPDF } from "jspdf";
import { IMG } from "./assets";
import { formatSgt } from "./programme";
import { certMeta, certRows } from "./certModel";

const INK = [20, 20, 20];
const SUB = [110, 106, 102];
const RULE = [207, 203, 198];
const AMBER = [150, 112, 60];
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
    const barW = rand() > 0.72 ? 0.85 : rand() > 0.4 ? 0.5 : 0.28;
    if (i % 2 === 0) {
      doc.setFillColor(...INK);
      doc.rect(cursor, y, barW, h, "F");
    }
    cursor += barW + 0.32;
    i += 1;
  }
}

/** Deterministic verification matrix — encodes the certificate ID string. */
function drawVerificationMatrix(doc, id, x, y, size = 16) {
  const cells = 21;
  const cell = size / cells;
  const rand = prng(hash(`verify-${id}`));
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, size, size, "F");
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  doc.rect(x, y, size, size, "S");
  doc.setFillColor(...INK);
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const finder = (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
      if (finder) continue;
      if (rand() > 0.52) doc.rect(x + c * cell, y + r * cell, cell, cell, "F");
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

function drawChip(doc, label, x, y) {
  const colour = label === "Validated" ? GREEN : label === "Reported" ? AMBER : INK;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.6);
  const text = label.toUpperCase();
  const w = doc.getTextWidth(text) + 3.2;
  doc.setDrawColor(...colour);
  doc.setLineWidth(0.22);
  doc.roundedRect(x, y - 2.5, w, 3.4, 1.7, 1.7, "S");
  doc.setTextColor(...colour);
  doc.text(text, x + 1.6, y);
  return w;
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

async function header(doc, pageW, isOffice) {
  const logo = await tryImage(IMG.logo);
  if (logo) {
    const h = 10;
    const w = (logo.w / logo.h) * h;
    try {
      doc.addImage(logo.data, "PNG", 16, 11, w, h);
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...INK);
      doc.text("CoffeeBot", 16, 19);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...INK);
    doc.text("CoffeeBot", 16, 19);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.6);
  doc.setTextColor(...SUB);
  doc.text("COFFEEBOT OPERATIONS, SINGAPORE", 16, 25.5);

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  doc.rect(pageW - 76, 11, 58, 9.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.6);
  doc.setTextColor(...INK);
  doc.text("HARBOURLINE BANK", pageW - 72, 17.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.4);
  doc.setTextColor(...SUB);
  doc.text("Deployed at Harbourline Bank", pageW - 76, 25.5);
  doc.text(isOffice ? "Office ESG summary" : "Sustainability certificate", pageW - 76, 29);
}

export async function downloadCertificate(cert, opts = {}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = 16;
  const right = pageW - 16;
  const usable = right - left;
  const meta = certMeta(cert);
  const rows = certRows(cert);

  // ticket frame + perforation
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.roundedRect(9, 7, pageW - 18, pageH - 14, 2, 2, "S");
  doc.setLineDashPattern([1.4, 1.4], 0);
  doc.line(pageW - 12, 12, pageW - 12, pageH - 12);
  doc.setLineDashPattern([], 0);

  await header(doc, pageW, cert.type === "office");

  let y = 44;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...SUB);
  doc.text(meta.kicker.toUpperCase(), left, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text(meta.title, left, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SUB);
  doc.text(meta.subtitle, left, y);
  y += 4;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.4);
  doc.line(left, y, right, y);

  // table 30 / 25 / 45
  const gap = 5;
  const xMeasure = left;
  const xValue = left + usable * 0.3;
  const xEvidence = left + usable * 0.55;
  const colMeasure = usable * 0.3 - gap;
  const colValue = usable * 0.25 - gap;
  const colEvidence = usable * 0.45 - gap;

  y += 8;
  doc.setFontSize(6.6);
  doc.setTextColor(...SUB);
  doc.text("MEASURE", xMeasure, y);
  doc.text("VALUE", xValue, y);
  doc.text("EVIDENCE / BASIS", xEvidence, y);
  y += 2.6;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.line(left, y, right, y);
  y += 5.4;

  const lineH = 3.5;
  rows.forEach((row) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.6);
    const chipW = doc.getTextWidth(row.chip.toUpperCase()) + 3.2;
    const evidenceWidth = colEvidence - chipW - 2;

    doc.setFontSize(8);
    const measureLines = doc.splitTextToSize(row.measure, colMeasure);
    const valueLines = doc.splitTextToSize(row.value, colValue);
    doc.setFontSize(7.2);
    const evidenceLines = doc.splitTextToSize(row.evidence, Math.max(28, evidenceWidth));
    const lines = Math.max(measureLines.length, valueLines.length, evidenceLines.length);
    const rowH = lines * lineH + 4.4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.text(measureLines, xMeasure, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.6);
    doc.text(valueLines, xValue, y);

    drawChip(doc, row.chip, xEvidence, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...SUB);
    doc.text(evidenceLines, xEvidence + chipW + 2, y);

    y += rowH;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.18);
    doc.line(left, y - 3.4, right, y - 3.4);
  });

  // signatures (left) and verification (right) share one band, so they never overlap
  const sigY = Math.min(Math.max(y + 14, 156), 170);
  const sigWidth = 54;
  meta.signatures.forEach((sig, i) => {
    const x = left + i * (sigWidth + 9);
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.25);
    doc.line(x, sigY, x + sigWidth, sigY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.text(sig.name, x, sigY + 4.4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    doc.setTextColor(...SUB);
    doc.text(sig.title, x, sigY + 7.8);
    doc.text(sig.date ? formatSgt(sig.date, false) : "Not yet issued", x, sigY + 11);
  });

  const vx = right - 74;
  drawVerificationMatrix(doc, cert.certId, vx, sigY - 2, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.4);
  doc.setTextColor(...SUB);
  doc.text("Scan to verify", vx, sigY + 17);
  doc.setFontSize(6);
  doc.setTextColor(...INK);
  doc.text(`/verify/${cert.certId}`, vx, sigY + 20.4);

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  doc.rect(vx + 22, sigY - 2, 52, 12);
  drawBarcode(doc, cert.certId, vx + 23.5, sigY - 0.5, 49, 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.6);
  doc.setTextColor(...SUB);
  doc.text(cert.certId, vx + 22, sigY + 14.4);
  doc.text(`Status: ${cert.status}`, vx + 22, sigY + 17.6);
  doc.text(cert.type === "office" ? "Marina Bay office" : `${cert.floorCode} floor`, vx + 22, sigY + 20.4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(...SUB);
  doc.text("CoffeeBot Re v2.3 · Evidence levels: weighed at collection, reported by employees, validated by the Floor Champion", left, pageH - 11);
  doc.text(cert.certId + " · " + cert.periodLabel, right - 52, pageH - 11);

  void opts;
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
    nextTarget: `${(reused * 1.15).toFixed(2)} kg reused · Set by Group Sustainability for the following month`,
    status: status || "draft",
    issuedAt: issuedAt || "",
    activitiesDone: rows.posts || 0,
    volunteeringHours: (rows.posts || 0) * 0.5,
  };
}
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { CspViolation, ChannelHistoryEntry } from "./realtimeStatus";

export interface CspExportOptions {
  fromTs?: number;
  toTs?: number;
  channelFilter?: string;
  directiveFilter?: string;
}

export function exportCspReport(
  violations: CspViolation[],
  history: ChannelHistoryEntry[],
  opts: CspExportOptions = {}
) {
  const { fromTs, toTs, channelFilter, directiveFilter } = opts;
  const inRange = (ts: number) =>
    (!fromTs || ts >= fromTs) && (!toTs || ts <= toTs);

  const filteredV = violations.filter(
    (v) =>
      inRange(v.at) &&
      (!directiveFilter || v.effectiveDirective === directiveFilter)
  );
  const filteredH = history.filter(
    (h) => inRange(h.at) && (!channelFilter || h.channel === channelFilter)
  );

  const doc = new jsPDF();
  const now = new Date();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 36, "F");
  doc.setTextColor(0, 255, 180);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CSP & Realtime Diagnostics Report", 14, 16);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${now.toLocaleString()}`, 14, 23);
  const range = `${fromTs ? new Date(fromTs).toLocaleString() : "—"} → ${
    toTs ? new Date(toTs).toLocaleString() : "—"
  }`;
  doc.text(`Window: ${range}`, 14, 29);

  // Summary
  let y = 46;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["CSP violations", String(filteredV.length)],
      ["Channel events", String(filteredH.length)],
      ["Channel filter", channelFilter || "(all)"],
      ["Directive filter", directiveFilter || "(all)"],
    ],
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [0, 255, 180], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14 },
    tableWidth: 100,
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Violations
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`CSP Violations (${filteredV.length})`, 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Time", "Directive", "Blocked URI", "Source"]],
    body: filteredV.slice(0, 200).map((v) => [
      new Date(v.at).toLocaleString(),
      v.effectiveDirective,
      (v.blockedURI || "(inline)").slice(0, 60),
      `${v.sourceFile || "-"}${v.lineNumber ? `:${v.lineNumber}` : ""}`.slice(0, 50),
    ]),
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42], textColor: [0, 255, 180], fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    margin: { left: 14, right: 14 },
  });

  // Channel history
  if (filteredH.length > 0) {
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 18, "F");
    doc.setTextColor(0, 255, 180);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Realtime Channel History", 14, 12);

    autoTable(doc, {
      startY: 24,
      head: [["Time", "Channel", "Mode", "Reason"]],
      body: filteredH.slice(0, 200).map((h) => [
        new Date(h.at).toLocaleString(),
        h.channel,
        h.mode.toUpperCase(),
        h.reason || "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [15, 23, 42], textColor: [0, 255, 180], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 285, 210, 12, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text(
      `RUCU SIEM CSP Report | Page ${i}/${pages} | CONFIDENTIAL`,
      14,
      291
    );
    doc.text(now.toISOString(), 160, 291);
  }

  doc.save(`CSP_Diagnostics_${now.toISOString().split("T")[0]}.pdf`);
}

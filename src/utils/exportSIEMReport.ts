import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportEvent {
  _source: string;
  _time: string;
  severity?: string;
  alert_type?: string;
  incident_type?: string;
  action?: string;
  source_ip?: string;
  destination_ip?: string;
  message?: string;
  description?: string;
  status?: string;
}

interface BlockedIp {
  ip_address: string;
  reason?: string;
  is_permanent: boolean;
  created_at: string;
}

export const exportSIEMReport = (
  events: ExportEvent[],
  blockedIps: BlockedIp[],
  stats: { totalEvents: number; critical: number; high: number; blocked: number }
) => {
  const doc = new jsPDF();
  const now = new Date();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(0, 255, 180);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("UCSF SIEM Security Report", 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${now.toLocaleString()}`, 14, 26);
  doc.text("Unified Cyber Security Framework", 14, 33);

  // Stats summary
  let y = 50;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", 14, y);
  y += 8;

  const statsData = [
    ["Total Events", stats.totalEvents.toString()],
    ["Critical Severity", stats.critical.toString()],
    ["High Severity", stats.high.toString()],
    ["Blocked IPs", stats.blocked.toString()],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: statsData,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [0, 255, 180], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14 },
    tableWidth: 80,
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Events table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Security Events (Top 50)", 14, y);
  y += 4;

  const eventRows = events.slice(0, 50).map((e) => [
    e._source === "incident" ? "Incident" : e._source === "firewall" ? "Firewall" : "IDS/IPS",
    e.alert_type || e.incident_type || e.action || "-",
    (e.severity || "medium").toUpperCase(),
    e.source_ip || "-",
    (e.message || e.description || "-").substring(0, 40),
    new Date(e._time).toLocaleString(),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Source", "Type", "Severity", "IP", "Details", "Time"]],
    body: eventRows,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42], textColor: [0, 255, 180], fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      2: { cellWidth: 18 },
      4: { cellWidth: 40 },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data: any) => {
      if (data.column.index === 2 && data.section === "body") {
        const val = data.cell.raw as string;
        if (val === "CRITICAL") data.cell.styles.textColor = [220, 38, 38];
        else if (val === "HIGH") data.cell.styles.textColor = [234, 179, 8];
      }
    },
  });

  // Blocked IPs on new page if needed
  if (blockedIps.length > 0) {
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 20, "F");
    doc.setTextColor(0, 255, 180);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Blocked IP Addresses", 14, 14);

    const ipRows = blockedIps.map((ip) => [
      ip.ip_address,
      ip.reason || "-",
      ip.is_permanent ? "Permanent" : "Temporary",
      new Date(ip.created_at).toLocaleString(),
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["IP Address", "Reason", "Type", "Blocked At"]],
      body: ipRows,
      theme: "striped",
      headStyles: { fillColor: [15, 23, 42], textColor: [0, 255, 180], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 285, 210, 12, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text(`UCSF SIEM Report | Page ${i} of ${totalPages} | CONFIDENTIAL`, 14, 291);
    doc.text(now.toISOString(), 160, 291);
  }

  doc.save(`SIEM_Report_${now.toISOString().split("T")[0]}.pdf`);
};

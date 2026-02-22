import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://127.0.0.1:8000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Report {
  report_id: number;
  report_no: string;
  report_date: string;
  valid_upto: string;
  report_status: string;
  report_done_by: string;
  formtype_id: number;
  formtype_name: string;
}

interface Customer {
  customer_id: number;
  customer_name: string;
  customer_address: string;
}

// ─── Helper: extract year from date string ────────────────────────────────────
// Handles formats: "27th July, 2025", "2025-07-27", "27-07-2025"
function extractYear(dateStr: string): string {
  if (!dateStr) return "Unknown Year";
  const m = dateStr.match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : "Unknown Year";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CompanyReportsPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state: which year+formtype accordion panels are open
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!customerId) return;
    axios.get(`${API}/customers/${customerId}/reports`)
      .then(res => {
        setCustomer(res.data.customer);
        setReports(res.data.reports);
        // Auto-open the most recent year's panels
        const years = [...new Set(res.data.reports.map((r: Report) => extractYear(r.report_date)))];
        if (years[0]) {
          const recentReports = res.data.reports.filter((r: Report) => extractYear(r.report_date) === years[0]);
          const keys = [...new Set(recentReports.map((r: Report) => `${years[0]}-${r.formtype_id}`))];
          setOpenPanels(new Set(keys as string[]));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customerId]);

  const togglePanel = (key: string) => {
    setOpenPanels(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── Group: year → formtype → reports[] ────────────────────────────────────
  const grouped: Record<string, Record<string, Report[]>> = {};
  for (const r of reports) {
    const year = extractYear(r.report_date);
    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][r.formtype_name]) grouped[year][r.formtype_name] = [];
    grouped[year][r.formtype_name].push(r);
  }
  const sortedYears = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      draft:    { bg: "#fef3c7", color: "#92400e", label: "Draft" },
      complete: { bg: "#d1fae5", color: "#065f46", label: "Complete" },
      approved: { bg: "#dbeafe", color: "#1e40af", label: "Approved" },
    };
    const style = map[status?.toLowerCase()] ?? { bg: "#f3f4f6", color: "#374151", label: status || "—" };
    return (
      <span style={{ ...s.badge, background: style.bg, color: style.color }}>
        {style.label}
      </span>
    );
  };

  if (loading) return <div style={s.info}>Loading…</div>;

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.topBar}>
        <button style={s.btnBack} onClick={() => navigate("/")}>← Companies</button>
        <button
          style={s.btnNew}
          onClick={() => navigate(`/add?customer=${customerId}`)}
        >
          + New Report
        </button>
      </div>

      <div style={s.companyHeader}>
        <div style={s.companyIcon}>🏭</div>
        <div>
          <h2 style={s.companyName}>{customer?.customer_name}</h2>
          {customer?.customer_address && (
            <p style={s.companyAddress}>{customer.customer_address}</p>
          )}
        </div>
      </div>

      <div style={s.divider} />

      {/* ── No reports ── */}
      {reports.length === 0 && (
        <div style={s.emptyState}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <p style={{ margin: 0, fontWeight: 600 }}>No reports yet</p>
          <p style={{ margin: "6px 0 20px", color: "#888", fontSize: 13 }}>
            Create the first inspection report for this company.
          </p>
          <button style={s.btnNew} onClick={() => navigate(`/add?customer=${customerId}`)}>
            + Create Report
          </button>
        </div>
      )}

      {/* ── Grouped accordion ── */}
      {sortedYears.map(year => (
        <div key={year} style={s.yearBlock}>
          {/* Year label */}
          <div style={s.yearLabel}>{year}</div>

          {Object.entries(grouped[year]).map(([formtypeName, formReports]) => {
            const panelKey = `${year}-${formReports[0].formtype_id}`;
            const isOpen = openPanels.has(panelKey);

            return (
              <div key={panelKey} style={s.accordion}>
                {/* Accordion header */}
                <div
                  style={s.accordionHeader}
                  onClick={() => togglePanel(panelKey)}
                >
                  <span style={s.accordionTitle}>
                    <span style={s.formIcon}>📄</span>
                    {formtypeName}
                    <span style={s.reportCount}>{formReports.length} report{formReports.length !== 1 ? "s" : ""}</span>
                  </span>
                  <span style={s.chevron}>{isOpen ? "▲" : "▼"}</span>
                </div>

                {/* Accordion body */}
                {isOpen && (
                  <div style={s.accordionBody}>
                    {formReports.map(r => (
                      <div key={r.report_id} style={s.reportRow}>
                        <div style={s.reportInfo}>
                          <span style={s.reportNo}>{r.report_no || `Report #${r.report_id}`}</span>
                          <span style={s.reportMeta}>
                            {r.report_date && `Date: ${r.report_date}`}
                            {r.valid_upto && ` · Valid upto: ${r.valid_upto}`}
                            {r.report_done_by && ` · By: ${r.report_done_by}`}
                          </span>
                        </div>
                        <div style={s.reportActions}>
                          {statusBadge(r.report_status)}
                          <button
                            style={s.btnView}
                            onClick={() => navigate(`/reports/${r.report_id}`)}
                          >
                            View
                          </button>
                          <button
                            style={s.btnEdit}
                            onClick={() => navigate(`/edit/${r.report_id}`)}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Times New Roman', Times, serif",
    maxWidth: 900,
    margin: "0 auto",
    padding: "28px 32px 80px",
    minHeight: "100vh",
    background: "#f9f9f7",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  btnBack: {
    background: "transparent", color: "#1d4ed8",
    border: "none", fontSize: 13, cursor: "pointer",
    fontWeight: 600, padding: "6px 0", fontFamily: "inherit",
  },
  btnNew: {
    background: "#1d4ed8", color: "#fff", border: "none",
    padding: "9px 20px", borderRadius: 6, fontSize: 13,
    cursor: "pointer", fontWeight: 600,
  },
  companyHeader: {
    display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20,
  },
  companyIcon: { fontSize: 36, marginTop: 2 },
  companyName: { margin: "0 0 4px", fontSize: 20, fontWeight: 700 },
  companyAddress: { margin: 0, fontSize: 12, color: "#666", lineHeight: 1.5 },
  divider: { borderTop: "2px solid #000", marginBottom: 24 },
  emptyState: {
    textAlign: "center", padding: "60px 0",
    color: "#555", fontStyle: "italic",
  },
  yearBlock: { marginBottom: 28 },
  yearLabel: {
    fontSize: 13, fontWeight: 700, color: "#555",
    textTransform: "uppercase", letterSpacing: 1,
    marginBottom: 8, paddingLeft: 4,
  },
  accordion: {
    border: "1px solid #e5e7eb", borderRadius: 8,
    marginBottom: 10, overflow: "hidden",
    background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  accordionHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "13px 18px", cursor: "pointer",
    background: "#fff",
    userSelect: "none",
  },
  accordionTitle: {
    display: "flex", alignItems: "center",
    gap: 10, fontWeight: 700, fontSize: 14,
  },
  formIcon: { fontSize: 16 },
  reportCount: {
    fontSize: 11, fontWeight: 400, color: "#888",
    background: "#f3f4f6", padding: "2px 8px", borderRadius: 12,
  },
  chevron: { fontSize: 11, color: "#999" },
  accordionBody: {
    borderTop: "1px solid #f0f0f0",
  },
  reportRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "11px 18px",
    borderBottom: "1px solid #f5f5f5",
    gap: 12,
  },
  reportInfo: {
    display: "flex", flexDirection: "column", gap: 3, flex: 1,
  },
  reportNo: { fontWeight: 600, fontSize: 13 },
  reportMeta: { fontSize: 11, color: "#888" },
  reportActions: {
    display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
  },
  badge: {
    fontSize: 11, fontWeight: 600, padding: "2px 10px",
    borderRadius: 12, whiteSpace: "nowrap",
  },
  btnView: {
    background: "#f3f4f6", color: "#111", border: "1px solid #d1d5db",
    padding: "5px 14px", borderRadius: 5, fontSize: 12,
    cursor: "pointer", fontWeight: 600,
  },
  btnEdit: {
    background: "#1d4ed8", color: "#fff", border: "none",
    padding: "5px 14px", borderRadius: 5, fontSize: 12,
    cursor: "pointer", fontWeight: 600,
  },
  info: {
    textAlign: "center", color: "#999", marginTop: 80,
    fontSize: 14, fontFamily: "Times New Roman",
  },
};
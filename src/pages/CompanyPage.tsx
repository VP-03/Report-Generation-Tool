import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Report {
  report_id: number;
  report_no: string | null;
  report_date: string | null;
  report_status: string | null;
  valid_upto: string | null;
  report_done_by: string | null;
  formtype_id: number;
  formtype_name: string;
  customer_id: number;
  customer_name: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CompanyPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterFormType, setFilterFormType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterDoneBy, setFilterDoneBy] = useState("");

  // ── Fetch all reports ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch("http://127.0.0.1:8000/reports")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setReports(data))
      .catch(() => setError("Could not load reports. Make sure the backend is running."))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived filter options ────────────────────────────────────────────────
  const customerOptions = useMemo(() => {
    const names = [...new Set(reports.map(r => r.customer_name))].filter(Boolean).sort();
    return names;
  }, [reports]);

  const formTypeOptions = useMemo(() => {
    const names = [...new Set(reports.map(r => r.formtype_name))].filter(Boolean).sort();
    return names;
  }, [reports]);

  const statusOptions = useMemo(() => {
    const statuses = [...new Set(reports.map(r => r.report_status))].filter(Boolean).sort();
    return statuses as string[];
  }, [reports]);

  const doneByOptions = useMemo(() => {
    const names = [...new Set(reports.map(r => r.report_done_by))].filter(Boolean).sort();
    return names as string[];
  }, [reports]);

  // ── Filtered reports ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return reports.filter(r => {
      if (filterCustomer && !r.customer_name?.toLowerCase().includes(filterCustomer.toLowerCase())) return false;
      if (filterFormType && r.formtype_name !== filterFormType) return false;
      if (filterStatus && r.report_status !== filterStatus) return false;
      if (filterDoneBy && r.report_done_by !== filterDoneBy) return false;
      if (filterDateFrom && r.report_date && r.report_date < filterDateFrom) return false;
      if (filterDateTo && r.report_date && r.report_date > filterDateTo) return false;
      return true;
    });
  }, [reports, filterCustomer, filterFormType, filterStatus, filterDoneBy, filterDateFrom, filterDateTo]);

  const clearFilters = () => {
    setFilterCustomer("");
    setFilterFormType("");
    setFilterStatus("");
    setFilterDoneBy("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasFilters = filterCustomer || filterFormType || filterStatus || filterDoneBy || filterDateFrom || filterDateTo;

  const statusBadge = (status: string | null) => {
    const label = status ?? "unknown";
    const color =
      label === "final" ? { bg: "#dcfce7", text: "#15803d", border: "#86efac" } :
      label === "draft"  ? { bg: "#fef9c3", text: "#854d0e", border: "#fde047" } :
                           { bg: "#f3f4f6", text: "#6b7280", border: "#d1d5db" };
    return (
      <span style={{
        background: color.bg, color: color.text,
        border: `1px solid ${color.border}`,
        padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: 0.4,
      }}>
        {label}
      </span>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Inspection Reports</h1>
          <p style={s.subtitle}>All reports — click a row to view, or use Edit to modify</p>
        </div>
        <button style={s.btnNew} onClick={() => navigate("/add")}>
          + New Report
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={s.filterPanel}>
        <div style={s.filterGrid}>

          <div style={s.filterField}>
            <label style={s.filterLabel}>Customer</label>
            <input
              style={s.filterInput}
              type="text"
              placeholder="Search customer…"
              value={filterCustomer}
              onChange={e => setFilterCustomer(e.target.value)}
              list="customer-list"
            />
            <datalist id="customer-list">
              {customerOptions.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div style={s.filterField}>
            <label style={s.filterLabel}>Form Type</label>
            <select style={s.filterSelect} value={filterFormType} onChange={e => setFilterFormType(e.target.value)}>
              <option value="">All</option>
              {formTypeOptions.map(ft => <option key={ft} value={ft}>{ft}</option>)}
            </select>
          </div>

          <div style={s.filterField}>
            <label style={s.filterLabel}>Status</label>
            <select style={s.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={s.filterField}>
            <label style={s.filterLabel}>Done By</label>
            <select style={s.filterSelect} value={filterDoneBy} onChange={e => setFilterDoneBy(e.target.value)}>
              <option value="">All</option>
              {doneByOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={s.filterField}>
            <label style={s.filterLabel}>Date From</label>
            <input style={s.filterInput} type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
          </div>

          <div style={s.filterField}>
            <label style={s.filterLabel}>Date To</label>
            <input style={s.filterInput} type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
          </div>

        </div>

        {hasFilters && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#555" }}>
              Showing <strong>{filtered.length}</strong> of <strong>{reports.length}</strong> reports
            </span>
            <button style={s.btnClear} onClick={clearFilters}>✕ Clear Filters</button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div style={s.info}>Loading reports…</div>
      ) : error ? (
        <div style={s.errorBanner}>{error}</div>
      ) : filtered.length === 0 ? (
        <div style={s.info}>
          {reports.length === 0
            ? "No reports found. Create one to get started."
            : "No reports match the current filters."}
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.theadRow}>
                <th style={s.th}>Report No.</th>
                <th style={s.th}>Customer</th>
                <th style={s.th}>Form Type</th>
                <th style={s.th}>Date</th>
                <th style={s.th}>Valid Upto</th>
                <th style={s.th}>Done By</th>
                <th style={s.th}>Status</th>
                <th style={{ ...s.th, textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((report, idx) => (
                <tr
                  key={report.report_id}
                  style={{
                    ...s.tbodyRow,
                    background: idx % 2 === 0 ? "#fff" : "#f9f9f7",
                  }}
                  onClick={() => navigate(`/reports/${report.report_id}`)}
                  title="Click to view report"
                >
                  <td style={{ ...s.td, fontWeight: 600, color: "#1d4ed8" }}>
                    {report.report_no || `#${report.report_id}`}
                  </td>
                  <td style={s.td}>{report.customer_name}</td>
                  <td style={s.td}>{report.formtype_name}</td>
                  <td style={s.td}>{report.report_date || "—"}</td>
                  <td style={s.td}>{report.valid_upto || "—"}</td>
                  <td style={s.td}>{report.report_done_by || "—"}</td>
                  <td style={s.td}>{statusBadge(report.report_status)}</td>
                  <td style={{ ...s.td, textAlign: "center" }}
                    onClick={e => e.stopPropagation()} // prevent row click from firing too
                  >
                    <button
                      style={s.btnEdit}
                      onClick={() => navigate(`/edit/${report.report_id}`)}
                      title="Edit this report"
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <p style={s.countBar}>
          {filtered.length} report{filtered.length !== 1 ? "s" : ""} shown
          {hasFilters ? ` (filtered from ${reports.length} total)` : ""}
        </p>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Times New Roman', Times, serif",
    maxWidth: 1100,
    margin: "0 auto",
    padding: "28px 40px 60px",
    minHeight: "100vh",
    background: "#f9f9f7",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
    borderBottom: "2px solid #000",
    paddingBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  btnNew: {
    background: "#15803d",
    color: "#fff",
    border: "none",
    padding: "10px 22px",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 700,
    fontFamily: "'Times New Roman', serif",
    letterSpacing: 0.3,
    whiteSpace: "nowrap",
  },
  filterPanel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "16px 20px",
    marginBottom: 20,
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
    gap: 14,
  },
  filterField: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#555",
  },
  filterInput: {
    fontSize: 12,
    padding: "6px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 5,
    fontFamily: "'Times New Roman', serif",
    background: "#fafafa",
    outline: "none",
  },
  filterSelect: {
    fontSize: 12,
    padding: "6px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 5,
    fontFamily: "'Times New Roman', serif",
    background: "#fafafa",
    cursor: "pointer",
  },
  btnClear: {
    background: "transparent",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    padding: "3px 10px",
    borderRadius: 5,
    fontSize: 11,
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "'Times New Roman', serif",
  },
  tableWrap: {
    overflowX: "auto",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  theadRow: {
    background: "#1e293b",
    color: "#fff",
  },
  th: {
    padding: "11px 14px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    whiteSpace: "nowrap",
    fontFamily: "'Times New Roman', serif",
  },
  tbodyRow: {
    cursor: "pointer",
    transition: "background 0.12s",
    borderBottom: "1px solid #f0f0ee",
  },
  td: {
    padding: "10px 14px",
    fontSize: 13,
    color: "#222",
    verticalAlign: "middle",
  },
  btnEdit: {
    background: "#1d4ed8",
    color: "#fff",
    border: "none",
    padding: "5px 14px",
    borderRadius: 5,
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "'Times New Roman', serif",
  },
  info: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    padding: "60px 0",
    fontStyle: "italic",
  },
  errorBanner: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#991b1b",
    padding: "14px 18px",
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 16,
  },
  countBar: {
    textAlign: "right",
    fontSize: 11,
    color: "#999",
    marginTop: 10,
    fontStyle: "italic",
  },
};

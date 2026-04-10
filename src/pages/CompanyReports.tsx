import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface Report {
  report_id: number;
  report_no: string | null;
  report_date: string | null;
  report_status: string | null;
  valid_upto: string | null;
  report_done_by: string | null;
  formtype_id: number;
  formtype_name: string;
}

interface Customer {
  customer_id: number;
  customer_name: string;
  customer_address: string | null;
}

export default function CompanyReportsPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    fetch(`http://127.0.0.1:8000/customers/${customerId}/reports`)
      .then(res => res.json())
      .then(data => {
        setCustomer(data.customer);
        setReports(data.reports);
      })
      .finally(() => setLoading(false));
  }, [customerId]);

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

  if (loading) return <div style={{ textAlign: "center", padding: 60, fontFamily: "Times New Roman", color: "#666" }}>Loading…</div>;

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <div style={s.topLeft}>
          <button style={s.btnBack} onClick={() => navigate("/")}>← Back</button>
          <div>
            <h2 style={s.heading}>{customer?.customer_name}</h2>
            {customer?.customer_address && (
              <p style={s.subheading}>{customer.customer_address}</p>
            )}
          </div>
        </div>
        <button style={s.btnNew} onClick={() => navigate(`/add?customer=${customerId}`)}>
          + New Report
        </button>
      </div>

      {reports.length === 0 ? (
        <div style={s.empty}>No reports for this customer yet.</div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.theadRow}>
                <th style={s.th}>Report No.</th>
                <th style={s.th}>Form Type</th>
                <th style={s.th}>Date</th>
                <th style={s.th}>Valid Upto</th>
                <th style={s.th}>Done By</th>
                <th style={s.th}>Status</th>
                <th style={{ ...s.th, textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, idx) => (
                <tr
                  key={report.report_id}
                  style={{ ...s.tbodyRow, background: idx % 2 === 0 ? "#fff" : "#f9f9f7" }}
                  onClick={() => navigate(`/reports/${report.report_id}`)}
                  title="Click to view report"
                >
                  <td style={{ ...s.td, fontWeight: 600, color: "#1d4ed8" }}>
                    {report.report_no || `#${report.report_id}`}
                  </td>
                  <td style={s.td}>{report.formtype_name}</td>
                  <td style={s.td}>{report.report_date || "—"}</td>
                  <td style={s.td}>{report.valid_upto || "—"}</td>
                  <td style={s.td}>{report.report_done_by || "—"}</td>
                  <td style={s.td}>{statusBadge(report.report_status)}</td>
                  <td style={{ ...s.td, textAlign: "center" }} onClick={e => e.stopPropagation()}>
                    <button style={s.btnEdit} onClick={() => navigate(`/edit/${report.report_id}`)}>
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'Times New Roman', Times, serif", maxWidth: 1000, margin: "0 auto", padding: "28px 40px 60px", minHeight: "100vh", background: "#f9f9f7" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, borderBottom: "2px solid #000", paddingBottom: 14 },
  topLeft: { display: "flex", alignItems: "flex-start", gap: 16 },
  btnBack: { background: "transparent", color: "#1d4ed8", border: "none", fontSize: 13, cursor: "pointer", fontWeight: 600, fontFamily: "inherit", padding: "4px 0", whiteSpace: "nowrap", marginTop: 2 },
  heading: { margin: 0, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  subheading: { margin: "3px 0 0", fontSize: 12, color: "#666", fontStyle: "italic" },
  btnNew: { background: "#15803d", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 700, fontFamily: "'Times New Roman', serif", whiteSpace: "nowrap" },
  tableWrap: { overflowX: "auto", borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  theadRow: { background: "#1e293b", color: "#fff" },
  th: { padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap", fontFamily: "'Times New Roman', serif" },
  tbodyRow: { cursor: "pointer", borderBottom: "1px solid #f0f0ee" },
  td: { padding: "10px 14px", fontSize: 13, color: "#222", verticalAlign: "middle" },
  btnEdit: { background: "#1d4ed8", color: "#fff", border: "none", padding: "5px 14px", borderRadius: 5, fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: "'Times New Roman', serif" },
  empty: { textAlign: "center", color: "#999", fontSize: 14, padding: "60px 0", fontStyle: "italic" },
};

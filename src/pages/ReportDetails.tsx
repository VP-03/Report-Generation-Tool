import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Field {
  formfield_id: string;
  formfield_label: string;
  formfield_order: number;
  section_no: string | null;
  section_title: string | null;
  sub_no: string | null;
  formfield_value: string | null;
  value: string;
}

interface FormTemplate {
  formtype_id: number;
  form_no: string;
  rule_text: string;
  form_title: string;
  certify_text: string;
  valid_label: string;
  authority_dept: string;
  company_name: string;
  company_scope: string;
  disclaimer_text: string;
}

interface ReportMeta {
  report_id: number;
  report_no?: string;
  report_date?: string;
  valid_upto?: string;
  authority_letter?: string;
  authority_valid?: string;
  [key: string]: any;
}

// ─── Component ────────────────────────────────────────────────────────────────
const ReportDetails = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [reportMeta, setReportMeta] = useState<ReportMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Fetch report ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!reportId) { setLoading(false); return; }
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/reports/${reportId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setTemplate(data.template ?? null);
        setReportMeta(data.report ?? null);
        setFields(
          Array.isArray(data.fields)
            ? data.fields.map((f: any) => ({ ...f, value: f.formfield_value ?? "" }))
            : []
        );
      } catch (err) {
        console.error("FETCH ERROR:", err);
        showToast("Failed to load report", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reportId]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Group fields by section ────────────────────────────────────────────────
  const groupedSections = () => {
    const sections: { sectionNo: string | null; title: string | null; items: Field[] }[] = [];
    let current: typeof sections[0] | null = null;
    for (const f of fields) {
      const key = f.section_no ?? "__root__";
      if (!current || current.sectionNo !== key) {
        current = { sectionNo: f.section_no, title: f.section_title, items: [] };
        sections.push(current);
      }
      current.items.push(f);
    }
    return sections;
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return <div style={s.loading}>Loading report…</div>;

  const meta: ReportMeta = reportMeta ?? { report_id: 0 };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.type === "success" ? "#14532d" : "#7f1d1d" }}>
          {toast.msg}
        </div>
      )}

      <div style={s.page} id="printable-report">

        {/* ── Report No + Date ── */}
        <div style={s.reportNoRow}>
          <span>Report No: {meta.report_no || meta.report_id || reportId}</span>
          <span>{meta.report_date || ""}</span>
        </div>

        {/* ── Form header (from DB template) ── */}
        {template ? (
          <div style={s.formHeader}>
            <p style={s.formNo}>{template.form_no}</p>
            <p style={s.formRule}>{template.rule_text}</p>
            <p style={s.formTitle}>{template.form_title}</p>
          </div>
        ) : (
          <div style={s.formHeader}>
            <p style={s.formNo}>Form</p>
            <p style={{ color: "#999", fontSize: 12 }}>
              Template not found — run db/init_db.py to seed form_template table.
            </p>
          </div>
        )}

        {/* ── Fields — read-only plain document view ── */}
        {fields.length === 0 ? (
          <div style={s.empty}>No fields found for this report.</div>
        ) : (
          <div style={s.fieldsContainer}>
            {groupedSections().map((section, si) => (
              <div key={si}>
                {section.title && section.items[0] && !section.items[0].sub_no && (
                  <div style={s.sectionHeading}>
                    {section.sectionNo && `${section.sectionNo}. `}
                    {section.title}
                  </div>
                )}
                {section.items.map(field => (
                  <div
                    key={field.formfield_id}
                    style={s.fieldRow}
                  >
                    <span style={{
                      ...s.fieldNum,
                      paddingLeft: field.sub_no ? 20 : 0,
                    }}>
                      {field.sub_no
                        ? `${field.sub_no})`
                        : field.section_no ? `${field.section_no}.` : ""}
                    </span>
                    <span style={s.fieldLabel}>{field.formfield_label}</span>
                    <span style={s.fieldColon}>:</span>
                    <span style={s.fieldValue}>
                      {field.value || <span style={{ color: "#bbb" }}>—</span>}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── Footer (from DB template) ── */}
        {template && (
          <>
            <div style={s.certBlock}>
              <p style={s.certText}>{template.certify_text}</p>
              {meta.valid_upto && (
                <p style={{ ...s.certText, fontWeight: 700, marginTop: 8 }}>
                  {template.valid_label} {meta.valid_upto}
                </p>
              )}
            </div>

            <div style={s.sigRow}>
              <div style={s.sigLeft}>
                <p style={s.sigBold}>{template.authority_dept}</p>
                {meta.authority_letter && (
                  <p style={s.sigSmall}>Authority Letter No.: {meta.authority_letter}</p>
                )}
                {meta.authority_valid && (
                  <p style={s.sigSmall}>Valid From: {meta.authority_valid}</p>
                )}
                {template.company_scope.split("\n").map((line, i) => (
                  <p key={i} style={s.sigSmall}>{line}</p>
                ))}
              </div>
              <div style={s.sigRight}>
                <p style={s.sigBold}>for {template.company_name}</p>
                <div style={{ height: 52 }} />
                <div style={s.sigLine} />
                <p style={{ ...s.sigSmall, textAlign: "right" }}>
                  Signature of Competent Person
                </p>
              </div>
            </div>

            <div style={s.disclaimer}>{template.disclaimer_text}</div>
          </>
        )}
      </div>

      {/* ── Fixed action bar ── */}
      <div style={s.actionBar}>
        {/* Edit → navigate to AddPage in edit mode */}
        <button
          style={s.btnEdit}
          onClick={() => navigate(`/edit/${reportId}`)}
        >
          ✏️ Edit
        </button>
        <button style={s.btnPrint} onClick={() => window.print()}>
          🖨️ Print
        </button>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; background: white; }
          #printable-report {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          div[style*="position: fixed"] { display: none !important; }
        }
        @page { size: A4; margin: 12mm; }
      `}</style>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: 13,
    maxWidth: 860,
    margin: "28px auto 110px",
    padding: "32px 48px 40px",
    background: "#fff",
    boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
    color: "#111",
    lineHeight: 1.6,
  },
  loading: {
    textAlign: "center", marginTop: 80,
    fontFamily: "Times New Roman", color: "#666", fontSize: 15,
  },
  reportNoRow: {
    display: "flex", justifyContent: "space-between",
    fontSize: 12, marginBottom: 14, paddingBottom: 8,
    borderBottom: "1px solid #666",
  },
  formHeader: {
    textAlign: "center", marginBottom: 20,
    paddingBottom: 14, borderBottom: "2px solid #000",
  },
  formNo: {
    fontSize: 17, fontWeight: 700, letterSpacing: 1,
    textTransform: "uppercase", margin: "0 0 4px",
  },
  formRule: { fontSize: 12, fontStyle: "italic", margin: "0 0 6px" },
  formTitle: {
    fontSize: 14, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: 0.4, margin: 0,
  },
  fieldsContainer: { marginTop: 10 },
  sectionHeading: {
    fontWeight: 700, fontSize: 12, textTransform: "uppercase",
    marginTop: 14, marginBottom: 2, letterSpacing: 0.3,
    borderBottom: "1px solid #ccc", paddingBottom: 3,
  },
  fieldRow: {
    display: "flex", alignItems: "flex-start",
    padding: "3px 0", borderBottom: "1px dotted #ddd",
  },
  fieldNum: {
    minWidth: 32, fontSize: 12, color: "#444",
    paddingTop: 1, flexShrink: 0,
  },
  fieldLabel: { flex: "0 0 44%", fontSize: 12, paddingRight: 8, color: "#222" },
  fieldColon: { flex: "0 0 16px", fontSize: 12, color: "#555", textAlign: "center" },
  fieldValue: { flex: 1, fontSize: 12, color: "#111" },
  certBlock: { marginTop: 24, paddingTop: 14, borderTop: "1px solid #999" },
  certText: { fontSize: 12, lineHeight: 1.7, margin: 0, textAlign: "justify" },
  sigRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginTop: 28, gap: 20,
  },
  sigLeft: { flex: 1 },
  sigRight: { flex: 1, textAlign: "right" },
  sigBold: { fontWeight: 700, fontSize: 12, margin: "0 0 4px" },
  sigSmall: { fontSize: 11, lineHeight: 1.65, color: "#333", margin: "0 0 1px" },
  sigLine: {
    borderTop: "1px solid #000", width: "65%",
    marginLeft: "auto", marginBottom: 4,
  },
  disclaimer: {
    marginTop: 24, paddingTop: 10, borderTop: "2px solid #000",
    fontSize: 10.5, color: "#444", lineHeight: 1.6,
    textAlign: "justify", fontStyle: "italic",
  },
  empty: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 13 },
  actionBar: {
    position: "fixed", bottom: 0, left: 0, right: 0,
    background: "#fff", borderTop: "1px solid #e5e7eb",
    padding: "12px 24px", display: "flex", gap: 12,
    justifyContent: "center", zIndex: 100,
    boxShadow: "0 -2px 10px rgba(0,0,0,0.07)",
  },
  btnEdit: {
    background: "#1d4ed8", color: "#fff", border: "none",
    padding: "10px 34px", borderRadius: 6, fontSize: 14,
    cursor: "pointer", fontWeight: 600,
  },
  btnPrint: {
    background: "#374151", color: "#fff", border: "none",
    padding: "10px 34px", borderRadius: 6, fontSize: 14,
    cursor: "pointer", fontWeight: 600,
  },
  toast: {
    position: "fixed", top: 20, right: 20, color: "#fff",
    padding: "12px 20px", borderRadius: 8, fontSize: 14,
    fontWeight: 600, zIndex: 999, boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
  },
};

export default ReportDetails;
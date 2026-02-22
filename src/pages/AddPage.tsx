import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const API = "http://127.0.0.1:8000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Field {
  formfield_id: string;
  formfield_label: string;
  section_no: string | null;
  section_title: string | null;
  sub_no: string | null;
  formfield_order: number;
  formfield_value?: string | null;
}

interface FormType {
  formtype_id: number;
  formtype_name: string;
  formtype_description: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AddPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isEditMode = !!reportId;

  // customer pre-selected from query param: /add?customer=3
  const preselectedCustomer = searchParams.get("customer");

  const [formTypes, setFormTypes] = useState<FormType[]>([]);
  const [formtypeId, setFormtypeId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(
    preselectedCustomer ? Number(preselectedCustomer) : null
  );
  const [fields, setFields] = useState<Field[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load form types for dropdown ───────────────────────────────────────────
  useEffect(() => {
    axios.get(`${API}/form-types`)
      .then(res => setFormTypes(res.data))
      .catch(() => setError("Could not load form types."));
  }, []);

  // ── Edit mode: load existing report ───────────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return;
    setLoading(true);
    axios.get(`${API}/reports/${reportId}`)
      .then(res => {
        const { report, fields: fetchedFields } = res.data;
        setFormtypeId(report.formtype_id);
        setCustomerId(report.customer_id);
        setFields(fetchedFields);

        const prefilled: Record<string, string> = {};
        fetchedFields.forEach((f: Field) => {
          prefilled[f.formfield_id] = f.formfield_value ?? "";
        });
        setValues(prefilled);
      })
      .catch(() => setError("Could not load report."))
      .finally(() => setLoading(false));
  }, [reportId]);

  // ── Create mode: load blank fields when form type selected ────────────────
  useEffect(() => {
    if (isEditMode || !formtypeId) return;
    setLoading(true);
    setFields([]);
    setValues({});
    axios.get(`${API}/form-fields/${formtypeId}`)
      .then(res => setFields(res.data))
      .catch(() => setError("Could not load form fields."))
      .finally(() => setLoading(false));
  }, [formtypeId, isEditMode]);

  const handleChange = (fieldId: string, value: string) =>
    setValues(prev => ({ ...prev, [fieldId]: value }));

  const buildFieldsPayload = () =>
    fields.map(f => ({ formfield_id: f.formfield_id, value: values[f.formfield_id] ?? "" }));

  // ── Submit — THE FIX: await properly and navigate in .then() ──────────────
  const handleSubmit = async () => {
    if (!formtypeId || !customerId) {
      setError("Please select a form type before saving.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      if (isEditMode) {
        await axios.put(`${API}/reports/${reportId}`, {
          fields: buildFieldsPayload(),
        });
        // ✅ Navigate AFTER await resolves — this was the blank page cause
        navigate(`/reports/${reportId}`, { replace: true });

      } else {
        const res = await axios.post(`${API}/reports`, {
          customer_id: customerId,
          formtype_id: formtypeId,
          report_done_by: "Inspector",
          fields: buildFieldsPayload(),
        });
        // ✅ Navigate to newly created report's detail page
        navigate(`/reports/${res.data.report_id}`, { replace: true });
      }
    } catch (err: any) {
      setSaving(false);
      setError(err.response?.data?.detail ?? "Save failed. Please try again.");
    }
    // NOTE: don't setSaving(false) on success — component unmounts on navigate
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

  const canGoBack = () => {
    if (isEditMode) return navigate(`/reports/${reportId}`);
    if (customerId) return navigate(`/company/${customerId}`);
    navigate("/");
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>

      {/* ── Top bar ── */}
      <div style={s.topBar}>
        <div style={s.topLeft}>
          <button style={s.btnBack} onClick={canGoBack}>← Back</button>
          <h2 style={s.heading}>
            {isEditMode ? "Edit Report" : "Create New Report"}
          </h2>
        </div>
      </div>

      {/* ── Error ── */}
      {error && <div style={s.errorBanner}>{error}</div>}

      {/* ── Form type selector (create mode only) ── */}
      {!isEditMode && (
        <div style={s.selectorRow}>
          <div style={s.selectorField}>
            <label style={s.selectorLabel}>Form Type</label>
            <select
              style={s.select}
              value={formtypeId ?? ""}
              onChange={e => setFormtypeId(Number(e.target.value) || null)}
            >
              <option value="">— Select form type —</option>
              {formTypes.map(ft => (
                <option key={ft.formtype_id} value={ft.formtype_id}>
                  {ft.formtype_name}
                  {ft.formtype_description ? ` — ${ft.formtype_description}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── Fields ── */}
      {loading ? (
        <div style={s.info}>Loading fields…</div>
      ) : !formtypeId ? (
        <div style={s.info}>Select a form type above to begin filling the report.</div>
      ) : fields.length === 0 ? (
        <div style={s.info}>No fields configured for this form type.</div>
      ) : (
        <div style={s.fieldsWrap}>
          {groupedSections().map((section, si) => (
            <div key={si} style={s.section}>
              {section.title && (
                <div style={s.sectionHeading}>
                  {section.sectionNo && `${section.sectionNo}. `}
                  {section.title}
                </div>
              )}
              {section.items.map(field => (
                <div
                  key={field.formfield_id}
                  style={{ ...s.fieldRow, paddingLeft: field.sub_no ? 28 : 0 }}
                >
                  <label style={s.fieldLabel}>
                    {field.sub_no
                      ? `${field.sub_no}) ${field.formfield_label}`
                      : field.formfield_label}
                  </label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="Enter value…"
                    value={values[field.formfield_id] ?? ""}
                    onChange={e => handleChange(field.formfield_id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Action bar (only show once fields are loaded) ── */}
      {formtypeId && fields.length > 0 && (
        <div style={s.actionBar}>
          <button style={s.btnSave} onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isEditMode ? "💾 Update Report" : "💾 Save Report"}
          </button>
          <button style={s.btnCancel} onClick={canGoBack} disabled={saving}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Times New Roman', Times, serif",
    maxWidth: 860,
    margin: "0 auto",
    padding: "28px 40px 120px",
    minHeight: "100vh",
    background: "#f9f9f7",
  },
  topBar: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 20,
    borderBottom: "2px solid #000", paddingBottom: 14,
  },
  topLeft: { display: "flex", alignItems: "center", gap: 16 },
  btnBack: {
    background: "transparent", color: "#1d4ed8", border: "none",
    fontSize: 13, cursor: "pointer", fontWeight: 600,
    fontFamily: "inherit", padding: 0,
  },
  heading: { margin: 0, fontSize: 17, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  errorBanner: {
    background: "#fef2f2", border: "1px solid #fca5a5",
    color: "#991b1b", padding: "10px 16px", borderRadius: 6,
    fontSize: 13, marginBottom: 16,
  },
  selectorRow: {
    display: "flex", gap: 20, marginBottom: 24,
    padding: "14px 16px", background: "#fff",
    border: "1px solid #e5e7eb", borderRadius: 8,
  },
  selectorField: { display: "flex", flexDirection: "column", gap: 5, flex: 1 },
  selectorLabel: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#555" },
  select: {
    fontSize: 13, padding: "7px 12px",
    border: "1px solid #d1d5db", borderRadius: 5,
    background: "#fff", cursor: "pointer", fontFamily: "inherit",
  },
  fieldsWrap: {
    background: "#fff", border: "1px solid #e5e7eb",
    borderRadius: 8, padding: "20px 24px",
  },
  section: { marginBottom: 16 },
  sectionHeading: {
    fontWeight: 700, fontSize: 12, textTransform: "uppercase",
    letterSpacing: 0.3, borderBottom: "1px solid #ddd",
    paddingBottom: 4, marginBottom: 8, marginTop: 18, color: "#333",
  },
  fieldRow: {
    display: "flex", alignItems: "flex-start",
    gap: 12, padding: "5px 0",
    borderBottom: "1px dotted #eee",
  },
  fieldLabel: {
    flex: "0 0 46%", fontSize: 12,
    paddingTop: 6, color: "#222", lineHeight: 1.4,
  },
  input: {
    flex: 1, border: "none",
    borderBottom: "1px solid #93c5fd",
    padding: "4px 6px", fontSize: 12,
    fontFamily: "'Times New Roman', serif",
    background: "transparent", color: "#111", outline: "none",
  },
  info: {
    textAlign: "center", color: "#999",
    fontSize: 13, padding: "60px 0",
    fontStyle: "italic",
  },
  actionBar: {
    position: "fixed", bottom: 0, left: 0, right: 0,
    background: "#fff", borderTop: "1px solid #e5e7eb",
    padding: "12px 24px", display: "flex", gap: 12,
    justifyContent: "center", zIndex: 100,
    boxShadow: "0 -2px 10px rgba(0,0,0,0.07)",
  },
  btnSave: {
    background: "#15803d", color: "#fff", border: "none",
    padding: "10px 36px", borderRadius: 6, fontSize: 14,
    cursor: "pointer", fontWeight: 600,
  },
  btnCancel: {
    background: "#fff", color: "#374151", border: "1px solid #d1d5db",
    padding: "10px 28px", borderRadius: 6, fontSize: 14,
    cursor: "pointer", fontWeight: 600,
  },
};
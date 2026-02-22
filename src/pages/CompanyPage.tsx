import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://127.0.0.1:8000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Customer {
  customer_id: number;
  customer_name: string;
  customer_address: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CompanyPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add company modal state
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [adding, setAdding] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    axios.get(`${API}/customers`)
      .then(res => setCustomers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddCompany = async () => {
    if (!newName.trim()) { setModalError("Company name is required."); return; }
    setAdding(true);
    setModalError("");
    try {
      const res = await axios.post(`${API}/customers`, {
        customer_name: newName.trim(),
        customer_address: newAddress.trim(),
      });
      setCustomers(prev => [...prev, {
        customer_id: res.data.customer_id,
        customer_name: newName.trim(),
        customer_address: newAddress.trim(),
      }]);
      setShowModal(false);
      setNewName("");
      setNewAddress("");
    } catch {
      setModalError("Failed to add company. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const filtered = customers.filter(c =>
    c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Inspection Reports</h1>
          <p style={s.subtitle}>Select a company to view or manage reports</p>
        </div>
        <button style={s.btnAdd} onClick={() => setShowModal(true)}>
          + Add Company
        </button>
      </div>

      {/* ── Search ── */}
      <div style={s.searchWrap}>
        <input
          style={s.search}
          placeholder="Search companies…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── Company list ── */}
      {loading ? (
        <div style={s.info}>Loading companies…</div>
      ) : filtered.length === 0 ? (
        <div style={s.info}>
          {search ? `No companies matching "${search}"` : "No companies yet. Add one to get started."}
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map(c => (
            <div
              key={c.customer_id}
              style={s.card}
              onClick={() => navigate(`/company/${c.customer_id}`)}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.13)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)")}
            >
              <div style={s.cardIcon}>🏭</div>
              <div style={s.cardName}>{c.customer_name}</div>
              {c.customer_address && (
                <div style={s.cardAddress}>{c.customer_address}</div>
              )}
              <div style={s.cardArrow}>View Reports →</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Company Modal ── */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Add New Company</h3>

            {modalError && <div style={s.modalError}>{modalError}</div>}

            <label style={s.modalLabel}>Company Name *</label>
            <input
              style={s.modalInput}
              placeholder="e.g. M/s. Kobelco Construction Equipment India Pvt. Ltd."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />

            <label style={s.modalLabel}>Address</label>
            <textarea
              style={{ ...s.modalInput, height: 72, resize: "vertical" }}
              placeholder="e.g. 505, Palmyra Road, Sricity DTZ, Tirupati - 517646"
              value={newAddress}
              onChange={e => setNewAddress(e.target.value)}
            />

            <div style={s.modalActions}>
              <button
                style={s.btnSave}
                onClick={handleAddCompany}
                disabled={adding}
              >
                {adding ? "Adding…" : "Add Company"}
              </button>
              <button
                style={s.btnCancel}
                onClick={() => { setShowModal(false); setModalError(""); }}
                disabled={adding}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Times New Roman', Times, serif",
    maxWidth: 1000,
    margin: "0 auto",
    padding: "36px 32px 80px",
    minHeight: "100vh",
    background: "#f9f9f7",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    borderBottom: "2px solid #000",
    paddingBottom: 16,
  },
  title: { margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: 0.5 },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: "#666", fontStyle: "italic" },
  btnAdd: {
    background: "#1d4ed8", color: "#fff", border: "none",
    padding: "10px 22px", borderRadius: 6, fontSize: 14,
    cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap",
    marginTop: 4,
  },
  searchWrap: { marginBottom: 24 },
  search: {
    width: "100%", padding: "10px 16px", fontSize: 13,
    border: "1px solid #d1d5db", borderRadius: 6,
    fontFamily: "inherit", background: "#fff",
    boxSizing: "border-box",
    outline: "none",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 18,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "20px 22px",
    cursor: "pointer",
    transition: "box-shadow 0.15s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  cardIcon: { fontSize: 28, marginBottom: 10 },
  cardName: { fontWeight: 700, fontSize: 14, marginBottom: 6, lineHeight: 1.4 },
  cardAddress: { fontSize: 11, color: "#777", lineHeight: 1.5, marginBottom: 12 },
  cardArrow: { fontSize: 12, color: "#1d4ed8", fontWeight: 600 },
  info: {
    textAlign: "center", color: "#999", marginTop: 60,
    fontSize: 14, fontStyle: "italic",
  },
  // Modal
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 200,
  },
  modal: {
    background: "#fff", borderRadius: 10,
    padding: "28px 32px", width: 480, maxWidth: "90vw",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    fontFamily: "'Times New Roman', serif",
  },
  modalTitle: { margin: "0 0 20px", fontSize: 16, fontWeight: 700 },
  modalError: {
    background: "#fef2f2", border: "1px solid #fca5a5",
    color: "#991b1b", padding: "8px 12px", borderRadius: 5,
    fontSize: 12, marginBottom: 14,
  },
  modalLabel: { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 },
  modalInput: {
    width: "100%", padding: "8px 12px", fontSize: 13,
    border: "1px solid #d1d5db", borderRadius: 5,
    fontFamily: "inherit", marginBottom: 14,
    boxSizing: "border-box", outline: "none",
  },
  modalActions: { display: "flex", gap: 10, marginTop: 4 },
  btnSave: {
    background: "#15803d", color: "#fff", border: "none",
    padding: "9px 24px", borderRadius: 6, fontSize: 13,
    cursor: "pointer", fontWeight: 600,
  },
  btnCancel: {
    background: "#fff", color: "#374151", border: "1px solid #d1d5db",
    padding: "9px 20px", borderRadius: 6, fontSize: 13,
    cursor: "pointer", fontWeight: 600,
  },
};
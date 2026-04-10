from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import os
from typing import List, Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "db", "inspection.db")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── DB ────────────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ── Helpers ───────────────────────────────────────────────────────────────────
def get_column_names(conn, table: str) -> set:
    """Return set of column names that actually exist in the table."""
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table})")
    return {row["name"] for row in cursor.fetchall()}

def safe_dict(row, columns: set) -> dict:
    """Convert sqlite Row to dict, only including columns that exist."""
    d = dict(row)
    return {k: v for k, v in d.items() if k in columns}

# ── Models ────────────────────────────────────────────────────────────────────
class FieldEntry(BaseModel):
    formfield_id: str
    value: str = ""

class ReportUpdate(BaseModel):
    fields: List[FieldEntry]

class ReportCreate(BaseModel):
    customer_id: int
    formtype_id: int
    report_done_by: Optional[str] = "Inspector"
    report_no: Optional[str] = ""
    report_date: Optional[str] = ""
    valid_upto: Optional[str] = ""
    authority_letter: Optional[str] = ""
    authority_valid: Optional[str] = ""
    fields: List[FieldEntry] = []      # default empty list — never fails validation

class CustomerCreate(BaseModel):
    customer_name: str
    customer_address: Optional[str] = ""

# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "Inspection Backend Running"}

# ── CUSTOMERS ─────────────────────────────────────────────────────────────────
@app.get("/customers")
def get_customers():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers ORDER BY customer_name")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/customers")
def add_customer(data: CustomerCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO customers (customer_name, customer_address) VALUES (?, ?)",
        (data.customer_name, data.customer_address)
    )
    conn.commit()
    customer_id = cursor.lastrowid
    conn.close()
    return {"customer_id": customer_id, "message": "Customer added successfully"}

# ── ALL REPORTS (home page) ───────────────────────────────────────────────────
@app.get("/reports")
def get_all_reports():
    conn = get_db()
    cursor = conn.cursor()

    meta_cols = get_column_names(conn, "report_metadata")

    optional_cols = ["report_no", "valid_upto", "report_done_by", "report_date"]
    select_extras = ", ".join(
        f"r.{col}" for col in optional_cols if col in meta_cols
    )
    if select_extras:
        select_extras = ", " + select_extras

    order_col = "r.report_date" if "report_date" in meta_cols else "r.report_id"

    cursor.execute(f"""
        SELECT
            r.report_id,
            r.customer_id,
            r.formtype_id,
            r.report_status
            {select_extras},
            c.customer_name,
            ft.formtype_name
        FROM report_metadata r
        JOIN customers c ON r.customer_id = c.customer_id
        JOIN form_types ft ON r.formtype_id = ft.formtype_id
        ORDER BY {order_col} DESC, r.report_id DESC
    """)

    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── REPORTS BY CUSTOMER ───────────────────────────────────────────────────────
@app.get("/customers/{customer_id}/reports")
def get_reports_by_customer(customer_id: int):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM customers WHERE customer_id = ?", (customer_id,))
    customer = cursor.fetchone()
    if not customer:
        conn.close()
        raise HTTPException(status_code=404, detail="Customer not found")

    # Detect which optional columns actually exist in report_metadata
    meta_cols = get_column_names(conn, "report_metadata")

    # Build SELECT list defensively — only include columns that exist
    optional_cols = ["report_no", "valid_upto", "report_done_by"]
    select_extras = ", ".join(
        f"r.{col}" for col in optional_cols if col in meta_cols
    )
    if select_extras:
        select_extras = ", " + select_extras

    # report_date may or may not exist
    order_col = "r.report_date" if "report_date" in meta_cols else "r.report_id"
    date_col = "r.report_date" if "report_date" in meta_cols else "NULL as report_date"

    cursor.execute(f"""
        SELECT
            r.report_id,
            r.formtype_id,
            r.report_status,
            {date_col}
            {select_extras},
            ft.formtype_name,
            ft.formtype_description
        FROM report_metadata r
        JOIN form_types ft ON r.formtype_id = ft.formtype_id
        WHERE r.customer_id = ?
        ORDER BY {order_col} DESC, ft.formtype_name
    """, (customer_id,))

    reports = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {"customer": dict(customer), "reports": reports}

# ── FORM TYPES ────────────────────────────────────────────────────────────────
@app.get("/form-types")
def get_form_types():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT formtype_id, formtype_name, formtype_description FROM form_types ORDER BY formtype_id"
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── FORM FIELDS ───────────────────────────────────────────────────────────────
@app.get("/form-fields/{formtype_id}")
def get_form_fields(formtype_id: int):
    conn = get_db()
    cursor = conn.cursor()

    fl_cols = get_column_names(conn, "formfield_labels")

    # Only select columns that exist
    optional = ["section_no", "section_title", "sub_no"]
    extra = ", ".join(col for col in optional if col in fl_cols)
    if extra:
        extra = ", " + extra

    cursor.execute(f"""
        SELECT formfield_id, formtype_id, formfield_label, formfield_order{extra}
        FROM formfield_labels
        WHERE formtype_id = ?
        ORDER BY formfield_order
    """, (formtype_id,))

    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── GET REPORT ────────────────────────────────────────────────────────────────
@app.get("/reports/{report_id}")
def get_report(report_id: int):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM report_metadata WHERE report_id = ?", (report_id,))
    report = cursor.fetchone()
    if not report:
        conn.close()
        raise HTTPException(status_code=404, detail="Report not found")

    formtype_id = report["formtype_id"]

    cursor.execute("SELECT * FROM form_template WHERE formtype_id = ?", (formtype_id,))
    template_row = cursor.fetchone()
    template = dict(template_row) if template_row else {}

    fl_cols = get_column_names(conn, "formfield_labels")
    optional = ["section_no", "section_title", "sub_no"]
    extra = ", ".join(f"f.{col}" for col in optional if col in fl_cols)
    if extra:
        extra = ", " + extra

    cursor.execute(f"""
        SELECT
            f.formfield_id, f.formtype_id, f.formfield_label, f.formfield_order{extra},
            fr.report_id, fr.formfield_value
        FROM formfield_labels f
        LEFT JOIN filled_report fr
            ON f.formfield_id = fr.formfield_id AND fr.report_id = ?
        WHERE f.formtype_id = ?
        ORDER BY f.formfield_order
    """, (report_id, formtype_id))

    fields = cursor.fetchall()
    conn.close()

    return {
        "form_type": formtype_id,
        "report": dict(report),
        "template": template,
        "fields": [dict(row) for row in fields],
    }

# ── CREATE REPORT ─────────────────────────────────────────────────────────────
@app.post("/reports")
def create_report(data: ReportCreate):
    conn = get_db()
    cursor = conn.cursor()

    meta_cols = get_column_names(conn, "report_metadata")

    # Build INSERT dynamically based on what columns exist
    base_cols = ["customer_id", "formtype_id", "report_done_by", "report_status"]
    base_vals = [data.customer_id, data.formtype_id, data.report_done_by, "draft"]

    optional_map = {
        "report_no":         data.report_no,
        "report_date":       data.report_date,
        "valid_upto":        data.valid_upto,
        "authority_letter":  data.authority_letter,
        "authority_valid":   data.authority_valid,
    }

    for col, val in optional_map.items():
        if col in meta_cols:
            base_cols.append(col)
            base_vals.append(val or "")

    placeholders = ", ".join("?" * len(base_cols))
    col_list = ", ".join(base_cols)

    cursor.execute(
        f"INSERT INTO report_metadata ({col_list}) VALUES ({placeholders})",
        base_vals
    )
    report_id = cursor.lastrowid

    for field in data.fields:
        if field.value:
            cursor.execute("""
                INSERT INTO filled_report (report_id, formfield_id, formfield_value)
                VALUES (?, ?, ?)
            """, (report_id, field.formfield_id, field.value))

    conn.commit()
    conn.close()
    return {"report_id": report_id, "message": "Report created successfully"}

# ── UPDATE REPORT ─────────────────────────────────────────────────────────────
@app.put("/reports/{report_id}")
def update_report(report_id: int, data: ReportUpdate):
    conn = get_db()
    cursor = conn.cursor()

    existing = cursor.execute(
        "SELECT report_id FROM report_metadata WHERE report_id = ?", (report_id,)
    ).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Report not found")

    cursor.execute("DELETE FROM filled_report WHERE report_id = ?", (report_id,))
    for field in data.fields:
        cursor.execute("""
            INSERT INTO filled_report (report_id, formfield_id, formfield_value)
            VALUES (?, ?, ?)
        """, (report_id, field.formfield_id, field.value or ""))

    conn.commit()
    conn.close()
    return {"message": "Report updated successfully"}

# ── FORM TEMPLATES ────────────────────────────────────────────────────────────
@app.get("/form-templates")
def get_all_templates():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM form_template ORDER BY formtype_id")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.put("/form-templates/{formtype_id}")
def update_template(formtype_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    allowed = ["form_no", "rule_text", "form_title", "certify_text",
               "valid_label", "authority_dept", "company_name",
               "company_scope", "disclaimer_text"]
    updates = {k: v for k, v in data.items() if k in allowed}
    if not updates:
        conn.close()
        raise HTTPException(status_code=400, detail="No valid fields to update")
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    cursor.execute(
        f"UPDATE form_template SET {set_clause} WHERE formtype_id = ?",
        list(updates.values()) + [formtype_id],
    )
    conn.commit()
    conn.close()
    return {"message": "Template updated successfully"}

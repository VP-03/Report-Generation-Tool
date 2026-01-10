from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import os
from typing import Dict, List

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "db", "inspection.db")

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DB HELPER ----------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ---------------- MODELS ----------------
class ReportCreate(BaseModel):
    customer_id: int
    formtype_id: int
    report_done_by: str
    fields: Dict[str, str]

# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {"status": "Inspection Backend Running"}

# ---------------- FORM TYPES ----------------
@app.get("/form-types")
def get_form_types():
    db = get_db()
    rows = db.execute(
        "SELECT formtype_id, formtype_name FROM form_types"
    ).fetchall()
    db.close()
    return [dict(row) for row in rows]

# ---------------- FORM FIELDS ----------------
@app.get("/form-fields/{formtype_id}")
def get_form_fields(formtype_id: int):
    db = get_db()
    rows = db.execute(
        """
        SELECT formfield_id, formfield_label
        FROM formfield_labels
        WHERE formtype_id = ?
        ORDER BY formfield_order
        """,
        (formtype_id,),
    ).fetchall()
    db.close()
    return [dict(row) for row in rows]

# ---------------- CREATE REPORT ----------------
@app.post("/reports")
def create_report(report: ReportCreate):
    db = get_db()
    cursor = db.cursor()

    # Create report metadata
    cursor.execute(
        """
        INSERT INTO report_metadata
        (customer_id, formtype_id, report_done_by, report_status)
        VALUES (?, ?, ?, ?)
        """,
        (
            report.customer_id,
            report.formtype_id,
            report.report_done_by,
            "SUBMITTED",
        ),
    )

    report_id = cursor.lastrowid

    # Insert filled fields
    for field_id, value in report.fields.items():
        cursor.execute(
            """
            INSERT INTO filled_report
            (report_id, formfield_id, formfield_value)
            VALUES (?, ?, ?)
            """,
            (report_id, field_id, value),
        )

    db.commit()
    db.close()

    return {"message": "Report saved", "report_id": report_id}

# ---------------- GET REPORT DETAILS ----------------
@app.get("/reports/{report_id}")
def get_report_details(report_id: int):
    db = get_db()
    rows = db.execute(
        """
        SELECT 
            fl.formfield_label,
            fr.formfield_value,
            fl.formfield_id
        FROM filled_report fr
        JOIN formfield_labels fl
            ON fr.formfield_id = fl.formfield_id
        WHERE fr.report_id = ?
        """,
        (report_id,),
    ).fetchall()
    db.close()
    return [dict(row) for row in rows]
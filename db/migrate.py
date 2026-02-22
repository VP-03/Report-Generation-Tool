"""
Run this ONCE to add missing columns to your existing DB.
Usage: python migrate.py
"""
import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), "inspection.db")

MIGRATIONS = [
    # table,              column,            definition
    ("report_metadata",  "report_no",        "TEXT DEFAULT ''"),
    ("report_metadata",  "valid_upto",       "TEXT DEFAULT ''"),
    ("report_metadata",  "authority_letter", "TEXT DEFAULT ''"),
    ("report_metadata",  "authority_valid",  "TEXT DEFAULT ''"),
    ("formfield_labels", "section_no",       "TEXT"),
    ("formfield_labels", "section_title",    "TEXT"),
    ("formfield_labels", "sub_no",           "TEXT"),
]

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

for table, column, definition in MIGRATIONS:
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        print(f"  ✅ Added: {table}.{column}")
    except sqlite3.OperationalError:
        print(f"  ⏭️  Exists: {table}.{column}")

# Create form_template table if missing
cursor.execute("""
CREATE TABLE IF NOT EXISTS form_template (
    formtype_id      INTEGER PRIMARY KEY,
    form_no          TEXT NOT NULL,
    rule_text        TEXT NOT NULL,
    form_title       TEXT NOT NULL,
    certify_text     TEXT NOT NULL,
    valid_label      TEXT,
    authority_dept   TEXT,
    company_name     TEXT,
    company_scope    TEXT,
    disclaimer_text  TEXT,
    FOREIGN KEY (formtype_id) REFERENCES form_types(formtype_id) ON DELETE CASCADE
)
""")
print("  ✅ form_template table ready")

# Seed form templates (INSERT OR IGNORE — never overwrites existing data)
cursor.executemany("""
INSERT OR IGNORE INTO form_template
    (formtype_id, form_no, rule_text, form_title, certify_text,
     valid_label, authority_dept, company_name, company_scope, disclaimer_text)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", [
    (1,
     "FORM NO.38",
     "(Prescribed under Rule 55 & 55A)",
     "REPORT OF EXAMINATION OF HOIST OR LIFT",
     "I certify that on the date of examination, I thoroughly examined the above equipment and the above is a correct report of the result.",
     "This report is valid up to",
     "Govt. of Andhra Pradesh, Factories Department",
     "VARAANGA ENGINEERS PVT. LTD.",
     "For Inspection, Testing and Certification of\nLifts, Hoists, Lifting Machinery, Lifting Tackles, Safety Belts.",
     "This test report depicts the actual position as seen by us at the time of examination & testing. Any remarks made are without any prejudice, only from the points of view of safety for men, material & equipment. Varaanga Engineers Pvt.Ltd., are not responsible for any damage or failure due to misrepresentation of information/specifications of equipment's, improper operations/maintenance, change in operating conditions, invisible intrinsic defects that cannot be detected in the reported examination (or) testing. In case of failure, intimate us immediately and preserve conditions for the investigation."
    ),
    (2,
     "FORM NO.8",
     "(Prescribed under Rule 56)",
     "REPORT OF EXAMINATION OF PRESSURE VESSEL OR PLANT",
     "I certify that on the date of examination, the pressure vessel or plant described above was thoroughly cleaned and (so far as its construction permits) made accessible for thorough examination and for such tests as were necessary for thorough examination and that on the said date, I thoroughly examined this pressure vessel or plant, including its fittings and that the above is a true report of my examination.",
     "This report is valid up to",
     "Govt. of Andhra Pradesh, Factories Department",
     "VARAANGA ENGINEERS PVT. LTD.",
     "For Inspection, Testing and Certification of\nLifts, Hoists, Lifting Machinery, Lifting Tackles,\nPressure Vessels/Plant, Safety Belts,\nThermic Fluid Heaters, Ovens and Driers. Power Presses.",
     "This test report depicts the actual position as seen by us at the time of examination & testing. Any remarks made are without any prejudice, only from the points of view of safety for men, material & equipment. Varaanga Engineers Pvt.Ltd., are not responsible for any damage or failure due to misrepresentation of information/specifications of equipment's, improper operations/maintenance, change in operating conditions, invisible intrinsic defects that cannot be detected in the reported examination (or) testing. In case of failure, intimate us immediately and preserve conditions for the investigation."
    ),
])
print("  ✅ form_template seeded (INSERT OR IGNORE)")

conn.commit()
conn.close()
print("\n🎉 Migration complete.")
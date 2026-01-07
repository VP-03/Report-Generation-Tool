import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "inspection.db")

def display_report(report_id):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    cursor.execute("""
    SELECT
        ft.formtype_name,
        ft.form_header,
        ffl.formfield_label,
        COALESCE(fr.formfield_value, '')
    FROM report_metadata rm
    JOIN form_types ft
        ON rm.formtype_id = ft.formtype_id
    JOIN formfield_labels ffl
        ON ft.formtype_id = ffl.formtype_id
    LEFT JOIN filled_report fr
        ON ffl.formfield_id = fr.formfield_id
       AND rm.report_id = fr.report_id
    WHERE rm.report_id = ?
    ORDER BY ffl.formfield_order
    """, (report_id,))

    rows = cursor.fetchall()

    if not rows:
        print("❌ Report not found")
        return

    print("\n" + "=" * 60)
    print(f"{rows[0][1]}  ({rows[0][0]})")
    print("=" * 60 + "\n")

    for _, _, label, value in rows:
        print(f"{label}")
        print(f"  → {value}\n")

    conn.close()

if __name__ == "__main__":
    display_report(1001)
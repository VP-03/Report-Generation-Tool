import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "inspection.db")

def run_test_inserts():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    try:
        # -------------------------------
        # 1. FORM TYPES
        # -------------------------------
        cursor.execute("""
        INSERT OR IGNORE INTO form_types
        (formtype_id, formtype_name, formtype_description, form_header, version_id)
        VALUES
        (1, 'Form 8', 'Pressure Vessel or Plant', 'FORM NO. 8', 1),
        (2, 'Form 38', 'Hoist or Lift Examination', 'FORM NO. 38', 1)
        """)

        # -------------------------------
        # 2. FORMFIELD LABELS
        # -------------------------------
        cursor.execute("""
        INSERT OR IGNORE INTO formfield_labels
        (formfield_id, formtype_id, formfield_label, formfield_order)
        VALUES
        ('F38_OCCUPIER', 2, 'Name of the Occupier', 1),
        ('F38_ADDRESS', 2, 'Address of the Factory', 2),
        ('F38_TYPE', 2, 'Type of Hoist or Lift', 3),

        ('F8_VESSEL_NAME', 1, 'Name of Pressure Vessel', 1),
        ('F8_MAX_PRESSURE', 1, 'Maximum Working Pressure', 2)
        """)

        # -------------------------------
        # 3. CUSTOMER
        # -------------------------------
        cursor.execute("""
        INSERT OR IGNORE INTO customers
        (customer_id, customer_name, customer_address)
        VALUES
        (1, 'ABC Industries', 'Hyderabad, Telangana')
        """)

        # -------------------------------
        # 4. REPORT METADATA
        # -------------------------------
        cursor.execute("""
        INSERT OR IGNORE INTO report_metadata
        (report_id, customer_id, formtype_id, report_date, report_done_by, report_status)
        VALUES
        (1001, 1, 2, '2025-07-25', 'Engineer A', 'COMPLETED')
        """)

        # -------------------------------
        # 5. FILLED REPORT
        # -------------------------------
        cursor.execute("""
        INSERT OR IGNORE INTO filled_report
        (report_id, formfield_id, formfield_value)
        VALUES
        (1001, 'F38_OCCUPIER', 'ABC Industries'),
        (1001, 'F38_ADDRESS', 'Hyderabad, Telangana'),
        (1001, 'F38_TYPE', 'Passenger Lift')
        """)

        # -------------------------------
        # 6. REPORT AUTHOR
        # -------------------------------
        cursor.execute("""
        INSERT OR IGNORE INTO report_author
        (author_id, author_name, license_no)
        VALUES
        (1, 'R. Kumar', 'LIC-AP-2025-009')
        """)

        # -------------------------------
        # 7. REPORT GENERATION
        # -------------------------------
        cursor.execute("""
        INSERT OR IGNORE INTO report_generation
        (generation_id, generation_date, generated_by, report_id)
        VALUES
        (5001, '2025-07-26', 'System', 1001)
        """)

        conn.commit()
        print("✅ Test data inserted successfully.\n")

        # -------------------------------
        # VERIFY DATA
        # -------------------------------
        print("📄 Retrieved Report Data:\n")

        cursor.execute("""
        SELECT
            ffl.formfield_label,
            fr.formfield_value
        FROM filled_report fr
        JOIN formfield_labels ffl
            ON fr.formfield_id = ffl.formfield_id
        WHERE fr.report_id = 1001
        ORDER BY ffl.formfield_order
        """)

        rows = cursor.fetchall()
        for label, value in rows:
            print(f"{label} : {value}")

    except Exception as e:
        print("❌ Error occurred:", e)
        conn.rollback()

    finally:
        conn.close()

if __name__ == "__main__":
    run_test_inserts()
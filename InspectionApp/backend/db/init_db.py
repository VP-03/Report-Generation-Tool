# db/init_db.py

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "inspection.db")

def create_tables():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    schema_sql = """
    -- FORM TYPES
    CREATE TABLE IF NOT EXISTS form_types (
        formtype_id INTEGER PRIMARY KEY,
        formtype_name TEXT,
        formtype_description TEXT,
        form_header TEXT,
        version_id INTEGER
    );

    -- FORMFIELD LABELS
    CREATE TABLE IF NOT EXISTS formfield_labels (
        formfield_id TEXT PRIMARY KEY,
        formtype_id INTEGER NOT NULL,
        formfield_label TEXT,
        formfield_order INTEGER,
        FOREIGN KEY (formtype_id)
            REFERENCES form_types(formtype_id)
            ON DELETE CASCADE
    );

    -- CUSTOMER
    CREATE TABLE IF NOT EXISTS customers (
        customer_id INTEGER PRIMARY KEY,
        customer_name TEXT,
        customer_address TEXT
    );

    -- FILLED REPORT
    CREATE TABLE IF NOT EXISTS filled_report (
        report_id INTEGER NOT NULL,
        formfield_id TEXT NOT NULL,
        formfield_value TEXT,
        PRIMARY KEY (report_id, formfield_id),
        FOREIGN KEY (formfield_id)
            REFERENCES formfield_labels(formfield_id)
            ON DELETE CASCADE
    );

    -- REPORT METADATA
    CREATE TABLE IF NOT EXISTS report_metadata (
        report_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        formtype_id INTEGER NOT NULL,
        report_date DATE,
        report_done_by TEXT,
        report_status TEXT,
        FOREIGN KEY (customer_id)
            REFERENCES customers(customer_id),
        FOREIGN KEY (formtype_id)
            REFERENCES form_types(formtype_id)
    );

    -- REPORT AUTHOR
    CREATE TABLE IF NOT EXISTS report_author (
        author_id INTEGER PRIMARY KEY,
        author_name TEXT,
        license_no TEXT NOT NULL
    );

    -- REPORT GENERATION
    CREATE TABLE IF NOT EXISTS report_generation (
        generation_id INTEGER PRIMARY KEY,
        generation_date DATE,
        generated_by TEXT,
        report_id INTEGER NOT NULL,
        FOREIGN KEY (report_id)
            REFERENCES report_metadata(report_id)
            ON DELETE CASCADE
    );
    """

    cursor.executescript(schema_sql)
    conn.commit()
    conn.close()

    print("✅ Database schema created successfully.")

if __name__ == "__main__":
    create_tables()
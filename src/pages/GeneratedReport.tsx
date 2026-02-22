import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AddPage.css";

interface ReportField {
  formfield_id: string;
  formfield_label: string;
  section_no: number;
  sub_no: string | null;
  section_title: string | null;
  formfield_order: number;
  value: string;
}

export default function ViewReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fields, setFields] = useState<ReportField[]>([]);

  useEffect(() => {
    if (!id) return;

    axios
      .get(`http://127.0.0.1:8000/reports/${id}`)
      .then(res => {
        console.log("REPORT DATA:", res.data);
        setFields(res.data.fields || []);
      })
      .catch(err => {
        console.error("Error loading report:", err);
      });
  }, [id]);

  let lastSection: number | null = null;

  return (
    <div className="page">
      <h2>FORM NO.8</h2>
      <p>(Prescribed under Rule 56)</p>
      <h3>REPORT OF EXAMINATION OF PRESSURE VESSEL OR PLANT</h3>

      <div className="form-container">
        {fields.length === 0 && (
          <p>No data found for this report.</p>
        )}

        {fields.map(field => {
          const showSection =
            field.section_no !== lastSection &&
            field.section_title;

          lastSection = field.section_no;

          return (
            <div key={field.formfield_id}>
              {showSection && (
                <div className="section-title-row">
                  <span className="section-number">
                    {field.section_no}.
                  </span>
                  <span className="section-title-text">
                    {field.section_title}
                  </span>
                  <span className="colon">:</span>
                </div>
              )}

              <div className={`form-row ${field.sub_no ? "sub-row" : ""}`}>
                <label className="form-label">
                  {!field.sub_no &&
                    `${field.section_no}. `}
                  {field.sub_no && `${field.sub_no}) `}
                  {field.formfield_label}
                </label>

                <span className="colon">:</span>
                <span>{field.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="action-buttons">
        <button onClick={() => navigate(`/add/${id}`)}>
          Edit Form
        </button>

        <button onClick={() => window.print()}>
          Generate Final Report
        </button>
      </div>
    </div>
  );
}
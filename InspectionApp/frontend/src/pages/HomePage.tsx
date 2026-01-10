import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface FormType {
  formtype_id: number;
  formtype_name: string;
}

export default function HomePage() {
  const [forms, setForms] = useState<FormType[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/form-types")
      .then(res => res.json())
      .then(data => setForms(data));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Select Inspection Form</h2>

      {forms.map(form => (
        <button
          key={form.formtype_id}
          style={{ display: "block", margin: "10px 0" }}
          onClick={() => navigate(`/details/${form.formtype_id}`)}
        >
          {form.formtype_name}
        </button>
      ))}
    </div>
  );
}
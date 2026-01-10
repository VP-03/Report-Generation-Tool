import { useEffect, useState } from "react";
import axios from "axios";

interface FormType {
  formtype_id: number;
  formtype_name: string;
}

interface FormField {
  formfield_id: string;
  formfield_label: string;
}

export default function AddPage() {
  const [formTypes, setFormTypes] = useState<FormType[]>([]);
  const [selectedForm, setSelectedForm] = useState<number | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/form-types")
      .then(res => setFormTypes(res.data));
  }, []);

  useEffect(() => {
    if (selectedForm) {
      axios.get(`http://127.0.0.1:8000/form-fields/${selectedForm}`)
        .then(res => setFields(res.data));
    }
  }, [selectedForm]);

  const handleChange = (id: string, value: string) => {
    setValues(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    await axios.post("http://127.0.0.1:8000/reports", {
      customer_id: 1,
      formtype_id: selectedForm,
      report_done_by: "Inspector",
      fields: values
    });
    alert("Report Saved");
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Add Inspection Report</h2>

      <select onChange={e => setSelectedForm(Number(e.target.value))}>
        <option>Select Form Type</option>
        {formTypes.map(ft => (
          <option key={ft.formtype_id} value={ft.formtype_id}>
            {ft.formtype_name}
          </option>
        ))}
      </select>

      <div style={{ marginTop: 20 }}>
        {fields.map(f => (
          <div key={f.formfield_id}>
            <label>{f.formfield_label}</label><br />
            <input
              type="text"
              onChange={e => handleChange(f.formfield_id, e.target.value)}
            />
          </div>
        ))}
      </div>

      {fields.length > 0 && (
        <button onClick={handleSubmit} style={{ marginTop: 20 }}>
          Submit
        </button>
      )}
    </div>
  );
}
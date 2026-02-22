import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function DetailsPage() {
  const { reportId } = useParams();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/reports/${reportId}`)
      .then(res => setData(res.data));
  }, [reportId]);

  return (
    <div style={{ padding: 30 }}>
      <h2>Report Details</h2>

      {data.map(row => (
        <div key={row.formfield_id}>
          <b>{row.formfield_label}</b>: {row.formfield_value}
        </div>
      ))}
    </div>
  );
}
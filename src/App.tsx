import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CompanyPage from "./pages/CompanyPage";
import CompanyReportsPage from "./pages/CompanyReports";
import AddPage from "./pages/AddPage";
import ReportDetails from "./pages/ReportDetails";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home — list of all companies */}
        <Route path="/" element={<CompanyPage />} />

        {/* Reports for a specific company (grouped by year + form type) */}
        <Route path="/company/:customerId" element={<CompanyReportsPage />} />

        {/* Create a new report (optionally pre-selecting company via ?customer=id) */}
        <Route path="/add" element={<AddPage />} />

        {/* Edit an existing report */}
        <Route path="/edit/:reportId" element={<AddPage />} />

        {/* Read-only report view */}
        <Route path="/reports/:reportId" element={<ReportDetails />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
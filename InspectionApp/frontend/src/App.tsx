import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddPage from "./pages/AddPage";
import DetailsPage from "./pages/DetailsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AddPage />} />
        <Route path="/details/:reportId" element={<DetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
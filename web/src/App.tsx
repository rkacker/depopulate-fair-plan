import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { DataPage } from "@/components/sections/DataPage";
import { Home } from "@/components/Home";
import { NotFound } from "@/components/NotFound";
import { ScrollManager } from "@/components/ScrollManager";

// Redirect legacy URLs (pre-router) to the canonical paths.
// Currently only ?page=data → /data; ?view=city / ?view=zip stay as query
// strings on / since those views are still experimental.
function useLegacyRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.pathname !== "/") return;
    const params = new URLSearchParams(location.search);
    if (params.get("page") === "data") {
      params.delete("page");
      const q = params.toString();
      navigate(`/data${q ? `?${q}` : ""}`, { replace: true });
    }
  }, [location, navigate]);
}

function AppShell() {
  useLegacyRedirect();
  return (
    <div className="min-h-screen bg-coastal-beige">
      <ScrollManager />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/data" element={<DataPage />} />
          {/* Old query-string URL → canonical path */}
          <Route path="/?page=data" element={<Navigate to="/data" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default AppShell;

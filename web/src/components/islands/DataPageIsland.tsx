import { BrowserRouter } from "react-router-dom";
import { DataPage } from "@/components/sections/DataPage";

export function DataPageIsland() {
  return (
    <BrowserRouter>
      <DataPage />
    </BrowserRouter>
  );
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import ScannerApp from "./scanner-app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ScannerApp />
  </StrictMode>
);

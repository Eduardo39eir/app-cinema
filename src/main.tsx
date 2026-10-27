import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ResponsiveApp from "./PhonePreview";
import "./styles.css";
import "./animations.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ResponsiveApp />
  </StrictMode>,
);

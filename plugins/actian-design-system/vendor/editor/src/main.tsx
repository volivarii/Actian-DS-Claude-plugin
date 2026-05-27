import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Apply the dark theme to the document root before React mounts so the
// first paint is correctly themed. The preview pane is re-lit via the
// .md-prose class (see base.css) so its background stays light gray.
document.documentElement.dataset.theme = "dark";

const root = document.getElementById("root");
if (!root) throw new Error("root element missing from index.html");
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

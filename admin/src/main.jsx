import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";

// HashRouter deliberately used here (not BrowserRouter) so the static build
// can be served from any path/subfolder without server-side rewrite rules —
// convenient for a quick Render.com/Netlify admin deploy.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);

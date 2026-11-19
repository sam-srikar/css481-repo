import React from "react";
import { createRoot } from "react-dom/client";
import App from "./movie-app.jsx";
import "./movie-app.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

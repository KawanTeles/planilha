import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ConfirmProvider } from "./components/ConfirmProvider.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import "./theme.css";
import "./styles/tabelas.css";
import "./styles/financeiro-mensal.css";
import "./styles/graficos.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

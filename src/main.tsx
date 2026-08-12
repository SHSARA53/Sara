import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { AppStateProvider } from "./state/AppStateContext";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
);

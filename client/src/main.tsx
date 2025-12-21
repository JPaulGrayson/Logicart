import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

// Global error handler to catch non-Error throws
window.addEventListener('error', (event) => {
  // If the error is not an Error instance, convert it
  if (!(event.error instanceof Error)) {
    // Prevent the default error handling
    event.preventDefault();
    // Log the non-Error value for debugging
    console.warn('[LogiGo] Caught non-Error exception:', event.error);
    // Don't show the error modal for these false positives
    return true;
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // If the rejection reason is not an Error instance, convert it
  if (!(event.reason instanceof Error)) {
    // Prevent the default handling
    event.preventDefault();
    // Log for debugging
    console.warn('[LogiGo] Caught non-Error promise rejection:', event.reason);
    return true;
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

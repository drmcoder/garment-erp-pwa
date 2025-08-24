import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress defaultProps warnings from external libraries (particularly nepali-datepicker-reactjs)
const originalWarn = console.warn;
const originalError = console.error;

// Suppress specific React warnings from external libraries
console.warn = (...args) => {
  if (typeof args[0] === 'string') {
    // Suppress defaultProps warning from external libraries
    if (args[0].includes('Support for defaultProps will be removed from function components')) {
      return;
    }
    // Suppress NepaliDatePickerWrapper specific warnings
    if (args[0].includes('NepaliDatePickerWrapper: Support for defaultProps')) {
      return;
    }
  }
  originalWarn.apply(console, args);
};

// Also suppress any related errors
console.error = (...args) => {
  if (typeof args[0] === 'string') {
    // Suppress defaultProps errors from external libraries
    if (args[0].includes('defaultProps will be removed from function components')) {
      return;
    }
  }
  originalError.apply(console, args);
};

// Enhanced Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("✅ SW registered successfully:", registration);

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("🔄 New service worker available");
              // Optionally show update notification
            }
          });
        });
      })
      .catch((error) => {
        console.log("❌ SW registration failed:", error);
      });
  });

  // Handle service worker messages
  navigator.serviceWorker.addEventListener("message", (event) => {
    console.log("Message from SW:", event.data);
  });
} else {
  console.log("⚠️ Service Worker not supported");
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ========================================
// TEMPORARY ANALYTICS DISABLE
// ========================================

// If you want to completely disable analytics for now, add this to your .env file:
// REACT_APP_ENABLE_ANALYTICS=false

// Or add this to your package.json scripts:
// "start": "REACT_APP_ENABLE_ANALYTICS=false react-scripts start"

console.log("🚀 TSA Production Management System initialized");

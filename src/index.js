import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import PWAInstall from "./components/common/PWAInstall";
import { LanguageProvider } from "./context/LanguageContext";
import "./styles/globals.css";

// Register Service Worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
      <PWAInstall />
    </LanguageProvider>
  </React.StrictMode>
);

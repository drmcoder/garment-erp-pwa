import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";

const PWAInstall = () => {
  const { currentLanguage } = useLanguage();
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    const handleAppInstalled = () => {
      setShowInstall(false);
      setDeferredPrompt(null);
      console.log("PWA installed successfully");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;

    if (result.outcome === "accepted") {
      console.log("User accepted PWA install");
    }

    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissTime = parseInt(dismissed);
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (Date.now() - dismissTime < twentyFourHours) {
        setShowInstall(false);
      }
    }
  }, []);

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 animate-slide-up">
      <div className="flex items-start space-x-3">
        <div className="bg-primary-100 p-2 rounded-lg">
          <svg
            className="w-6 h-6 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">
            {currentLanguage === "np" ? "एप इन्स्टल गर्नुहोस्" : "Install App"}
          </h3>
          <p className="text-gray-600 text-xs mt-1">
            {currentLanguage === "np"
              ? "छिटो पहुँच र अफलाइन सुविधाको लागि एप इन्स्टल गर्नुहोस्"
              : "Install app for faster access and offline features"}
          </p>

          <div className="flex space-x-2 mt-3">
            <button
              onClick={handleInstallClick}
              className="bg-primary-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-primary-700 transition-colors"
            >
              {currentLanguage === "np" ? "इन्स्टल गर्नुहोस्" : "Install"}
            </button>
            <button
              onClick={handleDismiss}
              className="text-gray-500 px-3 py-1 rounded text-xs hover:text-gray-700 transition-colors"
            >
              {currentLanguage === "np" ? "पछि गर्छु" : "Later"}
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PWAInstall;

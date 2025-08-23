import React, { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const PWAInstaller = () => {
  const { t, currentLanguage } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const isInWebAppPWA = window.navigator.standalone === true;
    setIsInstalled(isStandalone || isInWebAppPWA);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Show install prompt after a delay
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
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

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    // Clear the prompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  // Don't show if already installed or dismissed this session
  if (
    isInstalled ||
    !showInstallPrompt ||
    sessionStorage.getItem("pwa-install-dismissed")
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:w-80">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-800">
              {currentLanguage === "np"
                ? "एप इन्स्टल गर्नुहोस्"
                : "Install App"}
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              {currentLanguage === "np"
                ? "तपाईंको फोनमा TSA उत्पादन प्रबन्धन एप इन्स्टल गरेर अफलाइन प्रयोग गर्नुहोस्"
                : "Install TSA Production Management app on your phone for offline use"}
            </p>

            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs rounded font-medium hover:bg-blue-700 transition-colors"
              >
                <Download className="w-3 h-3 mr-1" />
                {currentLanguage === "np" ? "इन्स्टल" : "Install"}
              </button>

              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-gray-500 text-xs rounded hover:bg-gray-100 transition-colors"
              >
                {currentLanguage === "np" ? "पछि" : "Later"}
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstaller;

import React, { createContext, useContext, useState, useEffect } from "react";

const translations = {
  np: {
    appTitle: "गारमेन्ट ERP",
    subtitle: "उत्पादन व्यवस्थापन",
    login: "लगइन",
    username: "प्रयोगकर्ता नाम",
    password: "पासवर्ड",
    loginButton: "लगइन गर्नुहोस्",
    loading: "लोड हुँदै छ",
    goodMorning: "शुभ प्रभात",
    goodAfternoon: "शुभ दिन",
    goodEvening: "शुभ साँझ",
  },
  en: {
    appTitle: "Garment ERP",
    subtitle: "Production Management",
    login: "Login",
    username: "Username",
    password: "Password",
    loginButton: "Login",
    loading: "Loading",
    goodMorning: "Good Morning",
    goodAfternoon: "Good Afternoon",
    goodEvening: "Good Evening",
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState("np");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("garment-erp-language") || "np";
    setCurrentLanguage(savedLanguage);
  }, []);

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === "np" ? "en" : "np";
    setCurrentLanguage(newLanguage);
    localStorage.setItem("garment-erp-language", newLanguage);
  };

  const t = (key) => {
    return translations[currentLanguage][key] || key;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return t("goodMorning");
    } else if (hour < 17) {
      return t("goodAfternoon");
    } else {
      return t("goodEvening");
    }
  };

  const value = {
    currentLanguage,
    toggleLanguage,
    t,
    formatTime,
    getTimeBasedGreeting,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageToggle = ({ className = "" }) => {
  const { currentLanguage, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors ${className}`}
    >
      <span className="text-sm font-medium">
        {currentLanguage === "np" ? "🇳🇵 नेपाली" : "🇺🇸 English"}
      </span>
    </button>
  );
};

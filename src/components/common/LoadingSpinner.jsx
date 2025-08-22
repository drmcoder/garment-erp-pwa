import React from "react";
import { useLanguage } from "../../context/LanguageContext";

const LoadingSpinner = ({ size = "lg", message = null }) => {
  const { t } = useLanguage();

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div
        className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
      ></div>
      {message && <p className="mt-4 text-gray-600 text-sm">{message}</p>}
      {!message && <p className="mt-4 text-gray-600 text-sm">{t("loading")}</p>}
    </div>
  );
};

export default LoadingSpinner;

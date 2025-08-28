import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import BrandedLoader, { CompactLoader, MiniLoader } from "./BrandedLoader";

const LoadingSpinner = ({ size = "lg", message = null, fullScreen = false }) => {
  const { t } = useLanguage();

  // Convert size to branded loader size
  const sizeMapping = {
    sm: "small",
    md: "medium", 
    lg: "large",
    xl: "xlarge"
  };

  const displayMessage = message || t("loading");

  // Use full screen branded loader for larger sizes
  if (fullScreen || size === "xl") {
    return <BrandedLoader message={displayMessage} size={sizeMapping[size]} />;
  }

  // Use compact loader for medium sizes
  if (size === "lg" || size === "md") {
    return (
      <div className="flex items-center justify-center p-4">
        <CompactLoader message={displayMessage} />
      </div>
    );
  }

  // Use mini loader for small sizes
  return <MiniLoader />;
};

export default LoadingSpinner;

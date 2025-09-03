// Deprecated: Use Loader from core/components/ui instead
import React from "react";
import { Loader, CompactLoader, MiniLoader, FullScreenLoader } from "../../core/components/ui";

const LoadingSpinner = ({ size = "lg", message = null, fullScreen = false }) => {
  // Convert old size props to new format
  const sizeMapping = {
    sm: "small",
    md: "medium", 
    lg: "large",
    xl: "xlarge"
  };

  const mappedSize = sizeMapping[size];

  // Use full screen branded loader for larger sizes
  if (fullScreen || size === "xl") {
    return <FullScreenLoader message={message} />;
  }

  // Use compact loader for medium sizes
  if (size === "lg" || size === "md") {
    return <CompactLoader message={message} />;
  }

  // Use mini loader for small sizes
  return <MiniLoader />;
};

export default LoadingSpinner;

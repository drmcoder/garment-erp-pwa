import { useState, useEffect } from "react";
import { notificationService } from "../services/notificationService";
import { useLanguage } from "../context/LanguageContext";

export const useNotifications = () => {
  const { currentLanguage } = useLanguage();
  const [permissionStatus, setPermissionStatus] = useState("default");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeNotifications = async () => {
      const initialized = await notificationService.initialize();
      setIsInitialized(initialized);

      const status = notificationService.getPermissionStatus();
      setPermissionStatus(status.permission);
    };

    initializeNotifications();
  }, []);

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermissionStatus(granted ? "granted" : "denied");
    return granted;
  };

  const showWorkNotification = async (workData) => {
    return await notificationService.showWorkNotification(
      workData,
      currentLanguage
    );
  };

  const showQualityNotification = async (qualityData) => {
    return await notificationService.showQualityNotification(
      qualityData,
      currentLanguage
    );
  };

  return {
    isInitialized,
    permissionStatus,
    canShowNotifications: permissionStatus === "granted",
    requestPermission,
    showWorkNotification,
    showQualityNotification,
  };
};

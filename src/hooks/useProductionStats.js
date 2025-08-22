import { useState, useEffect } from "react";
import { ProductionService } from "../services/firebase-services";

export const useProductionStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();

    // Update stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    const result = await ProductionService.getTodayStats();
    if (result.success) {
      setStats(result.stats);
    }
    setLoading(false);
  };

  return { stats, loading, refresh: loadStats };
};

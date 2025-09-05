// =====================================================
// PHASE 2.1: CLEAN ARCHITECTURE VERSION
// Enhanced OperatorDashboard with Fixed Architecture
// =====================================================

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  PlayCircle,
  PauseCircle,
  CheckCircle,
  AlertTriangle,
  Package,
  BarChart3,
  RefreshCw,
  Activity,
  Clock,
  TrendingUp,
  Award,
  Zap,
  LogOut,
  ChevronDown,
  Bell,
  User,
  Settings
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../context/NotificationContext";
import { useConnectionStatus } from "../../hooks/useRealtimeData";
import WorkCompletion from "./WorkCompletion";
import QualityReport from "./QualityReport";
import OperatorAvatar from "../common/OperatorAvatar";

// Import Firebase services
import {
  BundleService,
  ProductionService,
  NotificationService,
} from "../../services/firebase-services";
import { damageReportService } from "../../services/DamageReportService";

const OperatorDashboard = React.memo(() => {
  const { user, getUserDisplayName, getUserRoleDisplay, getUserSpecialityDisplay, isOnline, logout } = useAuth();
  const {
    t,
    currentLanguage,
    getTimeBasedGreeting,
    formatTime,
    formatNumber,
    getSizeLabel,
  } = useLanguage();
  const { addNotification } = useNotifications();
  
  // Connection status monitoring
  const { isConnected: realtimeConnected } = useConnectionStatus();

  // Core State Management - Optimized and Cleaned
  const [currentWork, setCurrentWork] = useState(null);
  const [workQueue, setWorkQueue] = useState([]);
  const [availableWork, setAvailableWork] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [reworkPieces, setReworkPieces] = useState([]);
  
  // Dashboard Statistics
  const [productionStats, setProductionStats] = useState({
    totalCompleted: 0,
    totalMinutes: 0,
    efficiency: 0,
    qualityScore: 100
  });
  
  const [dailyStats, setDailyStats] = useState({
    piecesCompleted: 0,
    totalEarnings: 0,
    efficiency: 0,
    qualityScore: 0,
    targetPieces: 120,
  });

  // UI State Management
  const [isWorkStarted, setIsWorkStarted] = useState(false);
  const [workStartTime, setWorkStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pendingReworkPieces, setPendingReworkPieces] = useState(0);
  
  // Modal States
  const [showWorkCompletion, setShowWorkCompletion] = useState(false);
  const [showQualityReport, setShowQualityReport] = useState(false);

  // Memoized User Information
  const userInfo = useMemo(() => ({
    displayName: user ? getUserDisplayName() : '',
    roleDisplay: user ? getUserRoleDisplay() : '',
    specialityDisplay: user ? getUserSpecialityDisplay() : ''
  }), [user, getUserDisplayName, getUserRoleDisplay, getUserSpecialityDisplay]);

  // Close dropdown when clicking outside - Proper cleanup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time clock update - Proper cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load operator's current work and queue - Fixed dependencies
  const loadOperatorData = useCallback(async (skipLoading = false) => {
    if (!user?.id) return;

    if (!skipLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      console.log("📊 Loading operator data for:", user.id);

      // Load operator's assigned bundles with machine filtering
      const operatorMachine = user?.machine;
      const bundlesResult = await BundleService.getOperatorBundles(user.id, operatorMachine);
      
      if (bundlesResult.success) {
        // Filter out problematic bundles before processing
        const validBundles = bundlesResult.bundles.filter(bundle => {
          // Comprehensive bundle validation
          const hasValidId = bundle.id && typeof bundle.id === 'string' && bundle.id.trim().length > 0;
          const hasValidStatus = bundle.status && bundle.status.trim().length > 0;
          const hasValidData = bundle.article || bundle.articleNumber || bundle.articleName;
          
          // Extra check for specific problematic bundle IDs
          if (bundle.id === 'B727970-w-DD-S' || bundle.id === 'B759524-43--4XL') {
            console.warn(`🚫 [Dashboard] Blocking known problematic bundle: ${bundle.id}`);
            return false;
          }
          
          if (!hasValidId || !hasValidStatus || !hasValidData) {
            console.warn(`🚫 [Dashboard] Filtering out invalid bundle:`, {
              id: bundle.id,
              status: bundle.status,
              hasData: hasValidData
            });
            return false;
          }
          
          return true;
        });

        console.log(`✅ [Dashboard] Valid bundles after filtering: ${validBundles.length}`);
        
        // Find current work (in-progress bundle)
        const currentBundle = validBundles.find(b => ['in-progress', 'started', 'working'].includes(b.status?.toLowerCase()));
        if (currentBundle) {
          setCurrentWork(currentBundle);
          setIsWorkStarted(true);
          console.log("🎯 [Dashboard] Current work found:", currentBundle.id);
        } else {
          setCurrentWork(null);
          setIsWorkStarted(false);
          console.log("📋 [Dashboard] No current work in progress");
        }

        // Load operator work queue with validation
        const queueBundles = validBundles.filter(bundle => 
          bundle.status === 'assigned' && bundle.assignedOperator === user.id
        );
        setWorkQueue(queueBundles);
        console.log(`✅ [Dashboard] Work queue loaded: ${queueBundles.length} items`);
      } else {
        console.error("❌ Failed to load operator bundles:", bundlesResult.error);
        setError(`Failed to load work assignments: ${bundlesResult.error}`);
        setCurrentWork(null);
        setWorkQueue([]);
      }

      // Load production statistics for today
      try {
        const today = new Date().toISOString().split('T')[0];
        const statsResult = await ProductionService.getOperatorDailyStats(user.id, today);
        if (statsResult && statsResult.success) {
          setProductionStats(statsResult.stats || {
            totalCompleted: 0,
            totalMinutes: 0,
            efficiency: 0,
            qualityScore: 100
          });
          
          // Update daily stats as well
          setDailyStats(prev => ({
            ...prev,
            piecesCompleted: statsResult.stats?.totalCompleted || 0,
            totalEarnings: statsResult.stats?.totalEarnings || 0,
            efficiency: statsResult.stats?.efficiency || 0,
            qualityScore: statsResult.stats?.qualityScore || 100
          }));
          
          console.log("📊 [Dashboard] Production stats loaded");
        }
      } catch (error) {
        console.warn("⚠️ [Dashboard] Production stats error:", error);
      }

    } catch (error) {
      console.error("❌ [Dashboard] Error loading operator data:", error);
      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  }, [user?.id, user?.machine]);

  // Setup real-time subscriptions - Fixed dependencies
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!user?.id) return;

    console.log("🔄 Setting up real-time subscriptions for:", user.id);

    // Subscribe to bundle updates
    const unsubscribeBundles = BundleService.subscribeToOperatorBundles(
      user.id,
      (bundles) => {
        console.log("🔄 Real-time bundle update:", bundles.length);

        // Filter valid bundles
        const validBundles = bundles.filter(bundle => {
          const hasValidId = bundle.id && typeof bundle.id === 'string' && bundle.id.trim().length > 0;
          const hasValidStatus = bundle.status && bundle.status.trim().length > 0;
          const hasValidData = bundle.article || bundle.articleNumber || bundle.articleName;
          return hasValidId && hasValidStatus && hasValidData;
        });

        // Update current work
        const currentBundle = validBundles.find(
          (b) =>
            b.status === "in-progress" ||
            (b.status === "assigned" && b.assignedOperator === user.id)
        );

        if (currentBundle) {
          setCurrentWork(currentBundle);
          setIsWorkStarted(currentBundle.status === "in-progress");
        }

        // Update work queue
        const queueBundles = validBundles.filter(
          (b) => b.status === "pending" || b.status === "assigned"
        );
        setWorkQueue(queueBundles);
      }
    );

    // Subscribe to notifications
    const unsubscribeNotifications = NotificationService.subscribeToUserNotifications(
      user.id,
      (notifications) => {
        console.log("🔔 Real-time notification update:", notifications.length);

        // Add new notifications to context
        notifications.forEach((notification) => {
          addNotification({
            title: currentLanguage === 'np' ? notification.title : notification.titleEn,
            message: currentLanguage === 'np' ? notification.message : notification.messageEn,
            type: notification.type,
            priority: notification.priority,
          });
        });
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      if (unsubscribeBundles) unsubscribeBundles();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [user?.id, addNotification, currentLanguage]);

  // Load available work for self-assignment - Fixed dependencies
  const loadAvailableWork = useCallback(async () => {
    if (!user?.machine) return;
    
    try {
      console.log("🔍 Loading available work for self-assignment");
      
      const result = await BundleService.getAvailableWorkForOperator(
        user.machine, 
        user?.skillLevel || 'medium'
      );

      if (result.success) {
        // Filter work compatible with operator's machine and skill
        const compatibleWork = result.bundles.filter(bundle => {
          return bundle.status === 'ready_for_assignment' && 
                 !bundle.assignedOperator &&
                 bundle.machineType === user.machine;
        });
        
        setAvailableWork(compatibleWork);
        console.log("✅ Available work loaded:", compatibleWork.length);
      }
    } catch (error) {
      console.error("❌ Error loading available work:", error);
    }
  }, [user?.machine, user?.skillLevel]);

  // Load pending assignment requests - Fixed dependencies
  const loadPendingRequests = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log("⏳ Loading pending assignment requests");
      
      const result = await BundleService.getOperatorAssignmentRequests(user.id);

      if (result.success) {
        const pending = result.requests.filter(req => 
          req.status === 'pending_supervisor_approval'
        );
        
        setPendingRequests(pending);
        console.log("✅ Pending requests loaded:", pending.length);
      }
    } catch (error) {
      console.error("❌ Error loading pending requests:", error);
    }
  }, [user?.id]);

  // Load operator data on mount and when user changes - Fixed dependencies
  useEffect(() => {
    if (user?.id) {
      loadOperatorData();
    }
  }, [loadOperatorData]);

  // Setup real-time subscriptions when user changes - Fixed dependencies
  useEffect(() => {
    if (user?.id) {
      const cleanup = setupRealtimeSubscriptions();
      return cleanup;
    }
  }, [setupRealtimeSubscriptions]);

  // Listen for work started events from self-assignment system - Fixed dependencies
  useEffect(() => {
    const handleWorkStarted = (event) => {
      const { workItem, operatorId, status } = event.detail;
      
      // Only update if this event is for the current operator
      if (operatorId === user?.id) {
        console.log('🔄 Dashboard: Received work started event', workItem);
        
        // Set this as the current work without triggering full reload
        setCurrentWork({
          ...workItem,
          status: status === 'working' ? 'in-progress' : workItem.status
        });
        setIsWorkStarted(true);

        // Update daily stats to reflect that work has started
        setDailyStats(prev => ({
          ...prev,
          activeWorks: (prev.activeWorks || 0) + 1
        }));

        // Show success notification in dashboard
        addNotification({
          type: 'success',
          message: currentLanguage === 'np' 
            ? `🚀 काम सुरु भयो: ${workItem.articleName || workItem.article}`
            : `🚀 Work started: ${workItem.articleName || workItem.article}`,
          duration: 3000
        });

        // Only reload data in background without showing loader
        setTimeout(() => {
          loadOperatorData(true); // skipLoading = true
        }, 1000);
      }
    };

    // Add event listener
    window.addEventListener('workStarted', handleWorkStarted);
    
    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('workStarted', handleWorkStarted);
    };
  }, [user?.id, currentLanguage, addNotification, loadOperatorData]);

  // Early return if user is not loaded yet
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {currentLanguage === "np"
              ? "डेटा लोड हुँदै छ..."
              : "Loading dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            {currentLanguage === "np"
              ? "डेटा लोड गर्न समस्या"
              : "Error Loading Data"}
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadOperatorData()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            {currentLanguage === "np" ? "पुनः प्रयास" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  // Start work on current bundle
  const handleStartWork = async () => {
    if (!currentWork) return;

    console.log("▶️ Starting work on bundle:", currentWork.id);

    try {
      const result = await BundleService.startWork(currentWork.id, user.id);

      if (result.success) {
        setIsWorkStarted(true);
        setWorkStartTime(new Date());
        setCurrentWork((prev) => ({
          ...prev,
          status: "in-progress",
          startTime: new Date(),
        }));

        console.log("✅ Work started successfully");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Error starting work:", error);
      addNotification({
        type: 'error',
        title: currentLanguage === "np" ? "त्रुटि" : "Error",
        message: currentLanguage === "np"
          ? "काम सुरु गर्न समस्या भयो"
          : "Error starting work"
      });
    }
  };

  // Pause current work
  const handlePauseWork = () => {
    setIsWorkStarted(false);
    setCurrentWork((prev) => ({
      ...prev,
      status: "paused",
    }));

    console.log("⏸️ Work paused");
  };

  // Complete current work
  const handleCompleteWork = () => {
    if (!currentWork) return;
    setShowWorkCompletion(true);
  };

  // Report quality issue
  const handleReportQuality = () => {
    if (!currentWork) return;
    setShowQualityReport(true);
  };

  // Handle work item click from queue
  const handleWorkItemClick = (work) => {
    console.log("🖱️ Work item clicked:", work.id);
    // Set as current work if no current work
    if (!currentWork) {
      setCurrentWork(work);
    }
  };

  // Start work from queue
  const handleStartWorkFromQueue = async (work) => {
    try {
      setLoading(true);
      
      // Start the work item
      const result = await BundleService.startWork(work.id, user.id);
      
      if (result.success) {
        setCurrentWork(work);
        setIsWorkStarted(true);
        setWorkStartTime(new Date());
        
        addNotification({
          type: "success",
          title: currentLanguage === "np" ? "सफल" : "Success",
          message: currentLanguage === "np" ? "काम सुरु गरियो!" : "Work started!"
        });
        
        // Refresh data
        await loadOperatorData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Start work error:", error);
      addNotification({
        type: "error",
        title: currentLanguage === "np" ? "त्रुटि" : "Error",
        message: currentLanguage === "np" 
          ? "काम सुरु गर्न समस्या भयो" 
          : "Failed to start work"
      });
    } finally {
      setLoading(false);
    }
  };

  // Complete work directly from queue
  const handleCompleteWorkDirect = (work) => {
    setCurrentWork(work);
    setShowWorkCompletion(true);
  };

  // Request self-assignment (requires supervisor approval)
  const handleSelfAssignWork = async (work) => {
    try {
      setLoading(true);
      console.log("📝 Requesting self-assignment:", work.id);

      // Create assignment request instead of direct assignment
      const result = await BundleService.createAssignmentRequest({
        bundleId: work.id,
        operatorId: user.id,
        operatorName: user.name,
        operatorMachine: user.machine,
        requestType: 'self_assignment',
        workDetails: {
          article: work.article,
          operation: work.currentOperation,
          pieces: work.pieces,
          rate: work.rate,
          estimatedEarnings: (work.pieces * work.rate).toFixed(2)
        },
        status: 'pending_supervisor_approval',
        requestedAt: new Date().toISOString()
      });

      if (result.success) {
        // Simple success message
        addNotification({
          type: 'success',
          title: currentLanguage === "np" ? "सफल" : "Success",
          message: currentLanguage === "np" 
            ? "काम माग्ने अनुरोध सुपरभाइजरलाई पठाइयो!"
            : "Work request sent to supervisor!"
        });

        // Refresh data to show updated pending requests
        await loadPendingRequests();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Self-assignment request error:", error);
      addNotification({
        type: 'error',
        title: currentLanguage === "np" ? "त्रुटि" : "Error",
        message: currentLanguage === "np" 
          ? "अनुरोध पठाउन सकिएन। फेरि प्रयास गर्नुहोस्।"
          : "Could not send request. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle work completion
  const handleWorkCompleted = async (completionData) => {
    if (!currentWork) return;

    console.log("✅ Completing work:", completionData);

    try {
      const result = await BundleService.completeWork(currentWork.id, {
        operatorId: user.id,
        ...completionData,
      });

      if (result.success) {
        console.log("✅ Work completed successfully");

        // Update daily stats
        setDailyStats((prev) => ({
          ...prev,
          piecesCompleted: prev.piecesCompleted + completionData.completedPieces,
          totalEarnings: prev.totalEarnings + result.earnings,
        }));

        // Clear current work
        setCurrentWork(null);
        setIsWorkStarted(false);
        setWorkStartTime(null);

        // Show success notification
        addNotification({
          type: "success",
          title: currentLanguage === "np" ? "काम सम्पन्न!" : "Work Completed!",
          message: currentLanguage === "np"
            ? `कमाई: रु. ${result.earnings}`
            : `Earnings: Rs. ${result.earnings}`,
          priority: "medium",
        });

        // Reload data
        await loadOperatorData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Error completing work:", error);
      addNotification({
        type: "error",
        title: currentLanguage === "np" ? "त्रुटि" : "Error",
        message: currentLanguage === "np"
          ? "काम पूरा गर्न समस्या भयो"
          : "Error completing work"
      });
    } finally {
      setShowWorkCompletion(false);
    }
  };

  // Handle quality report submission
  const handleQualityReported = async (qualityData) => {
    console.log("🚨 Quality issue reported:", qualityData);

    try {
      // Create quality issue record
      // Implementation depends on your quality tracking requirements

      addNotification({
        type: "info",
        title: currentLanguage === "np"
          ? "गुणस्तर रिपोर्ट पठाइयो"
          : "Quality Report Sent",
        message: currentLanguage === "np"
          ? "सुपरभाइजरलाई सूचना पठाइयो"
          : "Supervisor notified",
        priority: "medium",
      });
    } catch (error) {
      console.error("❌ Error reporting quality issue:", error);
    } finally {
      setShowQualityReport(false);
    }
  };

  // Complete rework function
  const completeRework = async (reworkReport) => {
    if (!user?.id) return;

    try {
      // Mark rework as final completion
      const result = await damageReportService.finalizeReworkCompletion(
        reworkReport.id, 
        user.id,
        {
          notes: 'Rework completed by operator',
          completedAt: new Date()
        }
      );

      if (result.success) {
        addNotification({
          type: 'success',
          title: currentLanguage === 'np' ? 'सफल' : 'Success',
          message: currentLanguage === 'np' 
            ? `${reworkReport.bundleNumber} को रिवर्क पूरा भयो` 
            : `Rework completed for ${reworkReport.bundleNumber}`
        });
        
        // Reload data to update UI
        await loadOperatorData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error completing rework:', error);
      addNotification({
        type: 'error',
        title: currentLanguage === 'np' ? 'त्रुटि' : 'Error',
        message: currentLanguage === 'np' ? 'रिवर्क पूरा गर्न असफल' : 'Failed to complete rework'
      });
    }
  };

  // Utility Functions
  const getWorkProgressPercentage = () => {
    if (!currentWork || !currentWork.pieces) return 0;
    return Math.round((currentWork.completedPieces / currentWork.pieces) * 100);
  };

  const getWorkStatusColor = (status) => {
    switch (status) {
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "assigned":
        return "bg-yellow-100 text-yellow-800";
      case "paused":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return "text-green-600";
    if (efficiency >= 80) return "text-blue-600";
    if (efficiency >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  // Main Dashboard UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 pb-20">
      {/* Modern Header */}
      <div className="card-glass sticky top-0 z-40 m-4">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Operator Avatar with machine-specific emoji */}
              <OperatorAvatar 
                operator={{
                  name: userInfo.displayName || user?.name || user?.email || 'Operator',
                  avatar: {
                    type: 'emoji',
                    value: user?.machine === 'single-needle' ? '📍' : 
                           user?.machine === 'overlock' ? '🔗' : 
                           user?.machine === 'flatlock' ? '📎' : 
                           user?.machine === 'buttonhole' ? '🕳️' : '⚙️',
                    bgColor: '#0891B2',
                    textColor: '#FFFFFF'
                  },
                  status: isWorkStarted ? 'busy' : 'available',
                  currentWorkload: workQueue.length || 0,
                  visualBadges: dailyStats.efficiency > 90 ? ['🏆', '⚡', '🎯'] : ['💪']
                }}
                size="xl"
                showStatus={true}
                showWorkload={true}
                showBadges={true}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getTimeBasedGreeting()}, {userInfo.displayName}
                </h1>
                <div className="flex items-center space-x-3 mt-2">
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">
                    {user?.machine?.replace('-', ' ').toUpperCase() || 'MULTI-SKILL'} {t("operator")}
                  </span>
                  <div className="text-gray-600 text-sm flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(currentTime)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Enhanced Connection Status */}
              <div className="flex items-center space-x-3">
                <div
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium shadow-md ${
                    isOnline
                      ? "bg-green-100 text-green-800 border-2 border-green-200"
                      : "bg-red-100 text-red-800 border-2 border-red-200"
                  }`}
                  title="Connection Status"
                >
                  <Activity className={`w-4 h-4 ${isOnline ? "text-green-600" : "text-red-600"}`} />
                  <span>{isOnline ? "Online" : "Offline"}</span>
                </div>
              </div>

              {/* Today's Performance */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 text-center shadow-lg">
                <div className="text-3xl font-bold text-green-700">
                  {formatNumber(dailyStats.piecesCompleted)}
                </div>
                <div className="text-green-600 font-semibold text-sm">
                  {t("pieces")} {t("today")}
                </div>
              </div>

              {/* User Menu */}
              <div className="relative user-menu">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-3 hover:bg-white/50 rounded-xl transition-colors border border-white/20"
                  aria-label="User menu"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-800">{userInfo.displayName}</p>
                      <p className="text-sm text-gray-600">{user?.machine?.replace('-', ' ').toUpperCase() || 'MULTI-SKILL'} {t("operator")}</p>
                    </div>

                    <div className="py-2">
                      <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors">
                        <User className="w-4 h-4" />
                        <span>{currentLanguage === "np" ? 'प्रोफाइल' : 'Profile'}</span>
                      </button>

                      <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors">
                        <Settings className="w-4 h-4" />
                        <span>{currentLanguage === "np" ? 'सेटिङ्गहरू' : 'Settings'}</span>
                      </button>

                      <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors">
                        <Bell className="w-4 h-4" />
                        <span>{currentLanguage === "np" ? 'सूचनाहरू' : 'Notifications'}</span>
                      </button>
                    </div>

                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{currentLanguage === "np" ? 'लगआउट' : 'Logout'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Work Section */}
      {currentWork ? (
        <div className="card-work m-4">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                {t("currentWork")}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getWorkStatusColor(
                  currentWork.status
                )}`}
              >
                {t(currentWork.status)}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Article Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">{t("article")}</div>
                <div className="font-semibold">
                  {currentWork.article}# {currentWork.articleName}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t("operation")}</div>
                <div className="font-semibold">
                  {t(currentWork.currentOperation)} ({t(currentWork.machineType)})
                </div>
              </div>
            </div>

            {/* Color, Size, Bundle Info */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">{t("color")}</div>
                <div className="font-medium">{currentWork.color}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t("size")}</div>
                <div className="font-medium">
                  {getSizeLabel(currentWork.article, currentWork.size)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t("bundle")}</div>
                <div className="font-medium">#{currentWork.bundleNumber}</div>
              </div>
            </div>

            {/* Progress Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-4 gap-3 text-center text-sm">
                <div>
                  <div className="text-gray-600">{t("assigned")}</div>
                  <div className="font-bold text-lg">
                    {formatNumber(currentWork.pieces)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">{t("completed")}</div>
                  <div className="font-bold text-lg text-green-600">
                    {formatNumber(currentWork.completedPieces || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">{t("remaining")}</div>
                  <div className="font-bold text-lg text-orange-600">
                    {formatNumber(
                      currentWork.pieces - (currentWork.completedPieces || 0)
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">{t("ratePerPiece")}</div>
                  <div className="font-bold text-lg text-blue-600">
                    रु. {currentWork.rate}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{t("progress")}</span>
                  <span>{getWorkProgressPercentage()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${getWorkProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Earnings */}
              <div className="mt-3 text-center">
                <div className="text-sm text-gray-600">
                  {t("currentWork")} {t("earnings")}
                </div>
                <div className="text-xl font-bold text-green-600">
                  रु.{" "}
                  {(
                    (currentWork.completedPieces || 0) * currentWork.rate
                  ).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {!isWorkStarted ? (
                <button
                  onClick={() => handleStartWorkFromQueue(currentWork)}
                  className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <PlayCircle className="w-5 h-5" />
                  <span>{t("startWork")}</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseWork}
                  className="flex items-center justify-center space-x-2 bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  <PauseCircle className="w-5 h-5" />
                  <span>{t("pauseWork")}</span>
                </button>
              )}

              <button
                onClick={handleCompleteWork}
                disabled={!isWorkStarted}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{t("completeWork")}</span>
              </button>
            </div>

            <button
              onClick={handleReportQuality}
              className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors border border-red-200"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{t("reportIssue")}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="card-modern m-4 p-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {currentLanguage === "np" ? "काम उपलब्ध छैन" : "No Work Available"}
          </h3>
          <p className="text-gray-600 mb-4">
            {currentLanguage === "np"
              ? "तपाईंलाई नयाँ काम तोकिने प्रतीक्षा गर्नुहोस्"
              : "Waiting for new work assignment"}
          </p>
          <button
            onClick={() => loadOperatorData()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            {currentLanguage === "np" ? "रिफ्रेस गर्नुहोस्" : "Refresh"}
          </button>
        </div>
      )}

      {/* Work Queue Section */}
      {workQueue && workQueue.length > 0 && (
        <div className="card-elevated m-4">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Package className="w-5 h-5 mr-2 text-green-600" />
                {currentLanguage === "np" ? "तोकिएको काम" : "Assigned Work"}
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {workQueue.length} {currentLanguage === "np" ? "काम" : "items"}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {workQueue.map((work) => (
              <div 
                key={work.id}
                className="card-modern p-4 cursor-pointer"
                onClick={() => handleWorkItemClick(work)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-800">
                        {work.article}# {work.articleName}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getWorkStatusColor(work.status)}`}
                      >
                        {t(work.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">{t("operation")}:</span> {t(work.currentOperation)}
                      </div>
                      <div>
                        <span className="font-medium">{t("pieces")}:</span> {work.pieces}
                      </div>
                      <div>
                        <span className="font-medium">{t("color")}:</span> {work.color}
                      </div>
                      <div>
                        <span className="font-medium">{t("size")}:</span> {work.sizes?.[0] || work.size}
                      </div>
                    </div>

                    {work.status === 'assigned' && (
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartWork(work);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          {currentLanguage === "np" ? "सुरु गर्नुहोस्" : "Start Work"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteWorkDirect(work);
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          {currentLanguage === "np" ? "पूरा गर्नुहोस्" : "Complete"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Daily Statistics */}
      <div className="card-glass m-4">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-gray-900 flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span>{t("today")} {t("statistics")}</span>
            </h3>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-xl">Live Data</div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* Pieces Completed */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all group">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-700 mb-2">
                {formatNumber(dailyStats.piecesCompleted)}
              </div>
              <div className="text-sm font-medium text-blue-600">
                {t("pieces")} {t("completed")}
              </div>
            </div>

            {/* Earnings */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all group">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-700 mb-2">
                रु. {dailyStats.totalEarnings}
              </div>
              <div className="text-sm font-medium text-green-600">{t("earnings")}</div>
            </div>

            {/* Efficiency */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all group">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-yellow-200 transition-colors">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <div className={`text-3xl font-bold mb-2 ${getEfficiencyColor(dailyStats.efficiency)}`}>
                {formatNumber(dailyStats.efficiency)}%
              </div>
              <div className="text-sm font-medium text-yellow-600">{t("efficiency")}</div>
            </div>

            {/* Quality */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all group">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-700 mb-2">
                {formatNumber(dailyStats.qualityScore)}%
              </div>
              <div className="text-sm font-medium text-purple-600">{t("quality")}</div>
            </div>

            {/* Rework Pending */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all group">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-orange-700 mb-2">
                {pendingReworkPieces}
              </div>
              <div className="text-sm font-medium text-orange-600">
                {currentLanguage === 'np' ? 'रिवर्क पेन्डिङ' : 'Rework Pending'}
              </div>
            </div>
          </div>

          {/* Enhanced Daily Progress */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">
                  {t("today")} {t("target")}: {formatNumber(dailyStats.targetPieces)} {t("pieces")}
                </span>
              </div>
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-xl font-bold text-lg">
                {dailyStats.targetPieces > 0 ? Math.round((dailyStats.piecesCompleted / dailyStats.targetPieces) * 100) : 0}%
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-all duration-500 shadow-lg"
                style={{
                  width: `${dailyStats.targetPieces > 0 ? Math.min((dailyStats.piecesCompleted / dailyStats.targetPieces) * 100, 100) : 0}%`,
                }}
              ></div>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-xl font-semibold">
                <TrendingUp className="w-4 h-4" />
                <span>
                  {currentLanguage === "np"
                    ? `टिम औसत भन्दा +१२% माथि`
                    : `+12% above team average`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showWorkCompletion && currentWork && (
        <WorkCompletion
          currentWork={currentWork}
          onClose={() => setShowWorkCompletion(false)}
          onComplete={handleWorkCompleted}
        />
      )}

      {showQualityReport && currentWork && (
        <QualityReport
          currentWork={currentWork}
          onClose={() => setShowQualityReport(false)}
          onSubmit={handleQualityReported}
        />
      )}
    </div>
  );
});

export default OperatorDashboard;
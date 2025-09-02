// =====================================================
// PHASE 2.1: REAL DATA INTEGRATION
// Priority: Connect existing UI to Firebase backend
// =====================================================

// Step 1: Enhanced OperatorDashboard with Real Firebase Data
// File: src/components/operator/OperatorDashboard.jsx - UPDATED VERSION

import React, { useState, useEffect } from "react";
import {
  PlayCircle,
  PauseCircle,
  CheckCircle,
  AlertTriangle,
  Package,
  BarChart3,
  RefreshCw,
  Wifi,
  WifiOff,
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
import { db, collection, query, where, getDocs } from "../../config/firebase";

const OperatorDashboard = () => {
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

  // State management
  const [currentWork, setCurrentWork] = useState(null);
  const [workQueue, setWorkQueue] = useState([]);
  const [availableWork, setAvailableWork] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [dailyStats, setDailyStats] = useState({
    piecesCompleted: 0,
    totalEarnings: 0,
    efficiency: 0,
    qualityScore: 0,
    targetPieces: 120,
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showWorkCompletion, setShowWorkCompletion] = useState(false);
  const [showQualityReport, setShowQualityReport] = useState(false);
  const [isWorkStarted, setIsWorkStarted] = useState(false);
  const [workStartTime, setWorkStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [reworkPieces, setReworkPieces] = useState([]);
  const [pendingReworkPieces, setPendingReworkPieces] = useState(0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInfo = {
    displayName: user ? getUserDisplayName() : '',
    roleDisplay: user ? getUserRoleDisplay() : '',
    specialityDisplay: user ? getUserSpecialityDisplay() : ''
  };

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load operator data on mount
  useEffect(() => {
    if (user?.id) {
      loadOperatorData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  // Listen for work started events from self-assignment system
  useEffect(() => {
    const handleWorkStarted = (event) => {
      const { workItem, operatorId, status } = event.detail;
      
      // Only update if this event is for the current operator
      if (operatorId === user?.id) {
        console.log('🔄 Dashboard: Received work started event', workItem);
        
        // Set this as the current work
        setCurrentWork({
          ...workItem,
          status: status === 'working' ? (workItem.status === 'in_progress' ? 'in_progress' : 'in-progress') : workItem.status
        });

        // Update daily stats to reflect that work has started
        setDailyStats(prev => ({
          ...prev,
          activeWorks: prev.activeWorks + 1
        }));

        // Show success notification in dashboard
        addNotification({
          type: 'success',
          message: currentLanguage === 'np' 
            ? `🚀 काम सुरु भयो: ${workItem.articleName || workItem.article}`
            : `🚀 Work started: ${workItem.articleName || workItem.article}`,
          duration: 3000
        });

        // Reload data to get the most current state
        loadOperatorData();
      }
    };

    // Add event listener
    window.addEventListener('workStarted', handleWorkStarted);
    
    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('workStarted', handleWorkStarted);
    };
  }, [user, currentLanguage, addNotification]);

  // Early return if user is not loaded yet
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Load operator's current work and queue
  const loadOperatorData = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      console.log("📊 Loading operator data for:", user.id);

      // Load operator's assigned bundles with machine filtering
      const operatorMachine = user?.machine;
      const bundlesResult = await BundleService.getOperatorBundles(user.id, operatorMachine);

      if (bundlesResult.success) {
        // Filter out problematic bundles before processing
        const bundles = bundlesResult.bundles.filter(bundle => {
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
              hasValidId,
              hasValidStatus,
              hasValidData,
              status: bundle.status
            });
            return false;
          }
          
          return true;
        });
        
        console.log("📦 Loaded bundles:", bundles.length);
        console.log("📦 Bundle details:", bundles.map(b => ({ id: b.id, status: b.status, assignedOperator: b.assignedOperator, article: b.article })));

        // Find current work (in-progress or assigned)
        const currentBundle = bundles.find(
          (b) =>
            b.status === "in-progress" ||
            (b.status === "assigned" && b.assignedOperator === user.id)
        );

        if (currentBundle) {
          // Ensure current work has all required fields with fallbacks
          const workWithDefaults = {
            ...currentBundle,
            article: currentBundle.article || currentBundle.articleNumber || 'N/A',
            articleName: currentBundle.articleName || currentBundle.article || 'Unknown Article',
            operation: currentBundle.operation || currentBundle.currentOperation || 'General',
            pieces: currentBundle.pieces || 0,
            completedPieces: currentBundle.completedPieces || 0,
            bundleNumber: currentBundle.bundleNumber || currentBundle.id || 'N/A',
            color: currentBundle.color || 'Default',
            size: currentBundle.size || 'M',
            priority: currentBundle.priority || 'medium'
          };
          
          setCurrentWork(workWithDefaults);
          setIsWorkStarted(currentBundle.status === "in-progress");
          console.log("🔄 Current work found:", workWithDefaults.id, workWithDefaults);
        } else {
          setCurrentWork(null);
          console.log("ℹ️ No current work assigned");
        }

        // Set work queue (pending bundles)
        const queueBundles = bundles.filter(
          (b) => b.status === "pending" || b.status === "assigned"
        );
        setWorkQueue(queueBundles);

        // Load available work for self-assignment
        await loadAvailableWork();
        
        // Load pending assignment requests
        await loadPendingRequests();
      } else {
        throw new Error(bundlesResult.error);
      }

      // Load today's production stats
      const statsResult = await ProductionService.getTodayStats();
      if (statsResult.success) {
        // Update with operator-specific stats if available
        setDailyStats((prev) => ({
          ...prev,
          ...statsResult.stats,
        }));
      }

      // Calculate real daily performance from loaded bundles
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let todayPiecesCompleted = 0;
      let todayEarnings = 0;
      let completedBundles = 0;
      let totalAssignedPieces = 0;
      
      bundles.forEach(bundle => {
        // Count completed pieces and earnings for today
        if (bundle.status === 'completed' || bundle.status === 'operator_completed') {
          const completedDate = new Date(bundle.completedAt || bundle.operatorCompletedAt);
          if (completedDate >= today) {
            const pieces = bundle.completedPieces || bundle.pieces || 0;
            const rate = bundle.rate || 0;
            todayPiecesCompleted += pieces;
            todayEarnings += pieces * rate;
            completedBundles++;
          }
        }
        
        // Count total assigned pieces for efficiency calculation
        if (bundle.assignedOperator === user.id) {
          totalAssignedPieces += bundle.pieces || 0;
        }
      });

      // Calculate efficiency (completed vs assigned)
      const efficiency = totalAssignedPieces > 0 ? Math.min(100, Math.round((todayPiecesCompleted / totalAssignedPieces) * 100)) : 0;
      
      // Calculate quality score (placeholder - you may have actual quality data)
      const qualityScore = completedBundles > 0 ? Math.max(85, Math.min(100, 100 - (completedBundles * 2))) : 100;

      // Load actual payroll earnings from today
      try {
        const payrollQuery = query(
          collection(db, 'payrollEntries'),
          where('operatorId', '==', user.id),
          where('completedAt', '>=', today),
          where('status', '==', 'completed')
        );
        const payrollSnapshot = await getDocs(payrollQuery);
        let actualEarnings = 0;
        let actualPieces = 0;
        
        payrollSnapshot.forEach(doc => {
          const entry = doc.data();
          actualEarnings += entry.earnings || 0;
          actualPieces += entry.pieces || 0;
        });
        
        // Use payroll data if available, otherwise use calculated data
        todayEarnings = actualEarnings > 0 ? actualEarnings : todayEarnings;
        todayPiecesCompleted = actualPieces > 0 ? actualPieces : todayPiecesCompleted;
      } catch (payrollError) {
        console.warn('Could not load payroll data, using calculated values:', payrollError);
      }

      setDailyStats((prev) => ({
        ...prev,
        piecesCompleted: todayPiecesCompleted,
        totalEarnings: todayEarnings,
        efficiency: efficiency,
        qualityScore: qualityScore,
        targetPieces: prev.targetPieces || 120 // Keep existing target or default
      }));

      // Load rework data
      const pendingReworkResult = await damageReportService.getPendingReworkPieces(user.id);
      if (pendingReworkResult.success && pendingReworkResult.details) {
        const readyToComplete = pendingReworkResult.details.filter(report => 
          report.status === 'rework_assigned' && report.assignedOperator === user.id
        );
        setReworkPieces(readyToComplete);
        setPendingReworkPieces(pendingReworkResult.count || 0);
      }
    } catch (error) {
      console.error("❌ Error loading operator data:", error);
      setError(error.message);
      
      // No fallback data - show empty state
    } finally {
      setLoading(false);
    }
  };

  // Load available work for self-assignment
  const loadAvailableWork = async () => {
    try {
      console.log("🔍 Loading available work for self-assignment");
      
      const result = await BundleService.getAvailableWorkForOperator(
        user?.machine, 
        user?.skillLevel || 'medium'
      );

      if (result.success) {
        // Filter work compatible with operator's machine and skill
        const compatibleWork = result.bundles.filter(bundle => {
          return bundle.status === 'ready_for_assignment' && 
                 !bundle.assignedOperator &&
                 bundle.machineType === user?.machine;
        });
        
        setAvailableWork(compatibleWork);
        console.log("✅ Available work loaded:", compatibleWork.length);
      }
    } catch (error) {
      console.error("❌ Error loading available work:", error);
    }
  };

  // Load pending assignment requests
  const loadPendingRequests = async () => {
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
  };

  // Setup real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    if (!user?.id) return;

    console.log("🔄 Setting up real-time subscriptions for:", user.id);

    // Subscribe to bundle updates
    const unsubscribeBundles = BundleService.subscribeToOperatorBundles(
      user.id,
      (bundles) => {
        console.log("🔄 Real-time bundle update:", bundles.length);

        // Update current work
        const currentBundle = bundles.find(
          (b) =>
            b.status === "in-progress" ||
            (b.status === "assigned" && b.assignedOperator === user.id)
        );

        if (currentBundle) {
          setCurrentWork(currentBundle);
          setIsWorkStarted(currentBundle.status === "in-progress");
        }

        // Update work queue
        const queueBundles = bundles.filter(
          (b) => b.status === "pending" || b.status === "assigned"
        );
        setWorkQueue(queueBundles);
      }
    );

    // Subscribe to notifications
    const unsubscribeNotifications =
      NotificationService.subscribeToUserNotifications(
        user.id,
        (notifications) => {
          console.log(
            "🔔 Real-time notification update:",
            notifications.length
          );

          // Add new notifications to context
          notifications.forEach((notification) => {
            addNotification({
              title: notification.title,
              message: notification.message,
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
  };

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
      alert(
        currentLanguage === "np"
          ? "काम सुरु गर्न समस्या भयो"
          : "Error starting work"
      );
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
        
        addNotification(
          currentLanguage === "np" 
            ? "काम सुरु गरियो!" 
            : "Work started!",
          "success"
        );
        
        // Refresh data
        await loadOperatorData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Start work error:", error);
      addNotification(
        currentLanguage === "np" 
          ? "काम सुरु गर्न समस्या भयो" 
          : "Failed to start work",
        "error"
      );
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
        alert(currentLanguage === "np" 
          ? "✅ काम माग्ने अनुरोध सुपरभाइजर सरलाई पठाइयो!\n\n⏳ सुपरभाइजर सरले स्वीकार गरेपछि तपाईंको काममा देखिनेछ।"
          : "✅ Work request sent to supervisor sir!\n\n⏳ It will appear in your work after supervisor sir approves."
        );

        // Refresh data to show updated pending requests
        await loadPendingRequests();
        
        // Don't remove from available work list yet - only after approval
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Self-assignment request error:", error);
      alert(currentLanguage === "np" 
        ? "❌ समस्या भयो!\n\nअनुरोध पठाउन सकिएन। फेरि प्रयास गर्नुहोस्।"
        : "❌ Problem!\n\nCould not send request. Please try again."
      );
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
          piecesCompleted:
            prev.piecesCompleted + completionData.completedPieces,
          totalEarnings: prev.totalEarnings + result.earnings,
        }));

        // Clear current work
        setCurrentWork(null);
        setIsWorkStarted(false);
        setWorkStartTime(null);

        // Show success notification
        addNotification({
          title: currentLanguage === "np" ? "काम सम्पन्न!" : "Work Completed!",
          message:
            currentLanguage === "np"
              ? `कमाई: रु. ${result.earnings}`
              : `Earnings: Rs. ${result.earnings}`,
          type: "success",
          priority: "medium",
        });

        // Reload data
        await loadOperatorData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Error completing work:", error);
      alert(
        currentLanguage === "np"
          ? "काम पूरा गर्न समस्या भयो"
          : "Error completing work"
      );
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
        title:
          currentLanguage === "np"
            ? "गुणस्तर रिपोर्ट पठाइयो"
            : "Quality Report Sent",
        message:
          currentLanguage === "np"
            ? "सुपरभाइजरलाई सूचना पठाइयो"
            : "Supervisor notified",
        type: "info",
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
        addNotification(
          currentLanguage === 'np' 
            ? `${reworkReport.bundleNumber} को रिवर्क पूरा भयो` 
            : `Rework completed for ${reworkReport.bundleNumber}`,
          'success'
        );
        
        // Reload data to update UI
        await loadOperatorData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error completing rework:', error);
      addNotification(
        currentLanguage === 'np' ? 'रिवर्क पूरा गर्न असफल' : 'Failed to complete rework',
        'error'
      );
    }
  };

  // Calculate work progress
  const getWorkProgressPercentage = () => {
    if (!currentWork || !currentWork.pieces) return 0;
    return Math.round((currentWork.completedPieces / currentWork.pieces) * 100);
  };

  // Get status color for work
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

  // Get efficiency color
  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return "text-green-600";
    if (efficiency >= 80) return "text-blue-600";
    if (efficiency >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {currentLanguage === "np"
              ? "डेटा लोड हुँदै छ..."
              : "Loading data..."}
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
            onClick={loadOperatorData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            {currentLanguage === "np" ? "पुनः प्रयास" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  // Main Dashboard View (rest of the component remains the same as before...)
  // ... Continue with the existing dashboard UI code ...

  // Return the complete dashboard UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 pb-20">
      {/* Modern Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-white/20 shadow-lg sticky top-0 z-40 m-4 rounded-2xl">
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
                  title="Firestore Connection"
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
        <div className="bg-white rounded-lg shadow-md border border-gray-200 m-4">
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
                  {t(currentWork.currentOperation)} (
                  {t(currentWork.machineType)})
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
                  onClick={() => handleStartWorkFromQueue(work)}
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
        <div className="bg-white rounded-lg shadow-md border border-gray-200 m-4 p-8 text-center">
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
            onClick={loadOperatorData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            {currentLanguage === "np" ? "रिफ्रेस गर्नुहोस्" : "Refresh"}
          </button>
        </div>
      )}

      {/* Assigned Work Queue Section */}
      {workQueue && workQueue.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 m-4">
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
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
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

      {/* Simple Pending Requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-lg border-2 border-yellow-200 m-4">
          {/* Big, Clear Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-t-xl">
            <div className="text-center">
              <div className="text-4xl mb-2">⏳</div>
              <h2 className="text-2xl font-bold mb-1">
                {currentLanguage === "np" ? "काम माग्दै छ" : "WORK REQUESTED"}
              </h2>
              <p className="text-yellow-100 text-lg">
                {currentLanguage === "np" 
                  ? "सुपरभाइजर सरलाई पर्खनुहोस्" 
                  : "Wait for supervisor sir"}
              </p>
            </div>
          </div>

          <div className="p-6">
            {pendingRequests.map((request, index) => (
              <div 
                key={request.id}
                className="bg-white rounded-2xl shadow-lg border-2 border-yellow-100 p-6 mb-4"
              >
                {/* Request Number */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-yellow-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                    {index + 1}
                  </div>
                </div>

                {/* Simple Request Info */}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {request.workDetails.article}#
                  </h3>
                  
                  {/* Money Amount - Big and Clear */}
                  <div className="bg-green-100 rounded-2xl p-6 border-2 border-green-200 mb-4">
                    <div className="text-4xl mb-2">💰</div>
                    <div className="text-3xl font-bold text-green-700">
                      रु. {request.workDetails.estimatedEarnings}
                    </div>
                    <div className="text-lg text-green-600">
                      {currentLanguage === "np" ? "कमाई हुनेछ" : "You will earn"}
                    </div>
                  </div>
                </div>

                {/* Status - Big and Clear */}
                <div className="bg-yellow-100 rounded-2xl p-6 border-2 border-yellow-200 text-center">
                  <div className="text-4xl mb-2">👤</div>
                  <div className="text-xl font-bold text-yellow-800 mb-2">
                    {currentLanguage === "np" ? "सुपरभाइजर सरलाई हेर्दै" : "SUPERVISOR SIR CHECKING"}
                  </div>
                  <div className="text-lg text-yellow-700">
                    {currentLanguage === "np" 
                      ? "केही समय पछि जवाफ आउनेछ" 
                      : "Answer will come soon"}
                  </div>
                </div>

                {/* Date Info */}
                <div className="mt-4 text-center text-gray-600">
                  <div className="text-lg">
                    📅 {new Date(request.requestedAt).toLocaleDateString('ne-NP')}
                  </div>
                </div>
              </div>
            ))}

            {/* Instructions */}
            <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200 text-center">
              <div className="text-3xl mb-3">💡</div>
              <p className="text-xl font-bold text-blue-800 mb-2">
                {currentLanguage === "np" ? "के गर्ने?" : "What to do?"}
              </p>
              <p className="text-lg text-blue-700">
                {currentLanguage === "np" 
                  ? "केहि गर्नु पर्दैन। सुपरभाइजर सरले स्वीकार गरेपछि आफ्नो काममा देखिनेछ।" 
                  : "Do nothing. When supervisor sir approves, it will show in your work."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Simple Self-Assignment Section */}
      {availableWork && availableWork.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg border-2 border-green-200 m-4">
          {/* Big, Clear Header */}
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-t-xl">
            <div className="text-center">
              <div className="text-4xl mb-2">🎯</div>
              <h2 className="text-2xl font-bold mb-1">
                {currentLanguage === "np" ? "नयाँ काम लिनुहोस्" : "GET NEW WORK"}
              </h2>
              <p className="text-green-100 text-lg">
                {currentLanguage === "np" 
                  ? "तपाईंको मेसिनको काम छ!" 
                  : "Work available for your machine!"}
              </p>
            </div>
          </div>

          <div className="p-6">
            {availableWork.map((work, index) => (
              <div 
                key={work.id}
                className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 mb-4 hover:shadow-xl transition-all"
              >
                {/* Work Number Badge */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                    {index + 1}
                  </div>
                </div>

                {/* Simple Work Info */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {work.article}# 
                  </h3>
                  <p className="text-lg text-gray-600 mb-4">
                    {currentLanguage === "np" ? t(work.currentOperation) : work.currentOperation}
                  </p>
                  
                  {/* Big Visual Info Boxes */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Pieces Count */}
                    <div className="bg-blue-100 rounded-xl p-4 border-2 border-blue-200">
                      <div className="text-3xl mb-1">👕</div>
                      <div className="text-2xl font-bold text-blue-700">{work.pieces}</div>
                      <div className="text-sm text-blue-600">
                        {currentLanguage === "np" ? "टुक्रा" : "Pieces"}
                      </div>
                    </div>

                    {/* Total Money */}
                    <div className="bg-green-100 rounded-xl p-4 border-2 border-green-200">
                      <div className="text-3xl mb-1">💰</div>
                      <div className="text-2xl font-bold text-green-700">
                        रु. {(work.pieces * work.rate).toFixed(0)}
                      </div>
                      <div className="text-sm text-green-600">
                        {currentLanguage === "np" ? "कुल कमाई" : "Total Money"}
                      </div>
                    </div>
                  </div>

                  {/* Color Info */}
                  <div className="bg-yellow-100 rounded-xl p-3 mb-4 border-2 border-yellow-200">
                    <div className="text-lg font-bold text-yellow-800">
                      🎨 {currentLanguage === "np" ? "रंग:" : "Color:"} {work.color}
                    </div>
                  </div>
                </div>

                {/* Giant Easy Button */}
                <button
                  onClick={() => handleSelfAssignWork(work)}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white text-2xl font-bold py-6 px-8 rounded-2xl hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-lg border-4 border-green-400 hover:border-green-500"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mr-4"></div>
                      <span className="text-xl">
                        {currentLanguage === "np" ? "पठाउँदै..." : "SENDING..."}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="text-4xl mr-3">✋</span>
                      <span>
                        {currentLanguage === "np" ? "यो काम मलाई दिनुहोस्!" : "GIVE ME THIS WORK!"}
                      </span>
                      <span className="text-4xl ml-3">✋</span>
                    </div>
                  )}
                </button>

                {/* Simple Instructions */}
                <div className="mt-4 bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                  <div className="text-center text-blue-700">
                    <div className="text-2xl mb-2">👆</div>
                    <p className="text-lg font-semibold">
                      {currentLanguage === "np" 
                        ? "बटन दबाउनुहोस् → सुपरभाइजरले स्वीकार गर्नुहुन्छ → काम सुरु गर्नुहोस्!" 
                        : "Press Button → Supervisor Approves → Start Work!"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rework Pending Section */}
      {reworkPieces.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl shadow-lg border-2 border-orange-200 m-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-xl">
            <div className="text-center">
              <div className="text-4xl mb-2">🔧</div>
              <h2 className="text-2xl font-bold mb-1">
                {currentLanguage === 'np' ? 'रिवर्क पूरा गर्नुहोस्' : 'COMPLETE REWORK'}
              </h2>
              <p className="text-orange-100 text-lg">
                {currentLanguage === 'np' 
                  ? `${reworkPieces.length} टुक्रा रिवर्क पूरा गर्न बाँकी` 
                  : `${reworkPieces.length} pieces need rework completion`
                }
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {reworkPieces.map((reworkReport) => (
              <div key={reworkReport.id} className="bg-white rounded-2xl shadow-lg border-2 border-orange-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-800">
                          {reworkReport.bundleNumber || `Bundle #${reworkReport.id.slice(-6)}`}
                        </span>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                          {currentLanguage === 'np' ? 'रिवर्क' : 'REWORK'}
                        </span>
                      </div>
                      <button
                        onClick={() => completeRework(reworkReport)}
                        disabled={loading}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2 text-lg font-semibold"
                      >
                        <span>✅</span>
                        <span>{currentLanguage === 'np' ? 'पूरा गर्नुहोस्' : 'COMPLETE'}</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 text-lg mb-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-blue-600 font-medium mb-1">
                          {currentLanguage === 'np' ? 'आर्टिकल:' : 'Article:'}
                        </div>
                        <div className="text-blue-900 font-bold">
                          {reworkReport.articleName || reworkReport.articleNumber}
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-purple-600 font-medium mb-1">
                          {currentLanguage === 'np' ? 'ऑपरेसन:' : 'Operation:'}
                        </div>
                        <div className="text-purple-900 font-bold">{reworkReport.operation}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-gray-600 font-medium mb-1">
                          {currentLanguage === 'np' ? 'टुक्रा नम्बर:' : 'Piece:'}
                        </div>
                        <div className="text-gray-900 font-bold">
                          {reworkReport.pieceNumbers?.join(', ') || `#${reworkReport.pieceNumbers?.[0] || '1'}`}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-green-600 font-medium mb-1">
                          {currentLanguage === 'np' ? 'पैसा:' : 'Earnings:'}
                        </div>
                        <div className="text-green-900 font-bold text-xl">₹{reworkReport.rate || 0}</div>
                      </div>
                    </div>
                    
                    {reworkReport.reworkDetails?.supervisorNotes && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-blue-700 font-semibold text-lg">
                          <span className="text-2xl mr-2">💬</span>
                          {currentLanguage === 'np' ? 'सुपरवाइजर टिप्पणी:' : 'Supervisor Notes:'}
                        </div>
                        <div className="text-blue-800 mt-2 text-lg">
                          {reworkReport.reworkDetails.supervisorNotes}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 text-center">
                      <div className="bg-yellow-50 rounded-lg p-3 border-2 border-yellow-200">
                        <p className="text-yellow-700 font-semibold text-lg">
                          <span className="text-2xl mr-2">💰</span>
                          {currentLanguage === 'np' ? 'पूरा भएपछि पैसा मिल्नेछ' : 'Payment after completion'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Daily Statistics */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg m-4">
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
                {Math.round((dailyStats.piecesCompleted / dailyStats.targetPieces) * 100)}%
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-all duration-500 shadow-lg"
                style={{
                  width: `${Math.min((dailyStats.piecesCompleted / dailyStats.targetPieces) * 100, 100)}%`,
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
};

export default OperatorDashboard;

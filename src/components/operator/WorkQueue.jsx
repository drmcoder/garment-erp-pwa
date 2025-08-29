// src/components/operator/WorkQueue.jsx
// Complete work queue with full day visibility and management

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { NotificationContext } from "../../contexts/NotificationContext";
import { db, collection, getDocs, query, where, orderBy, COLLECTIONS } from "../../config/firebase";

const WorkQueue = ({ onWorkSelected, onSelfAssign }) => {
  const { user } = useContext(AuthContext);
  const { t, currentLanguage, formatNumber, formatCurrency, formatRelativeTime, formatDate } =
    useLanguage();
  const { showNotification } = useContext(NotificationContext);

  const [workQueue, setWorkQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all, pending, assigned, completed
  const [selectedWork, setSelectedWork] = useState(null);
  const [todayStats, setTodayStats] = useState({
    totalWork: 0,
    completed: 0,
    pending: 0,
    totalPieces: 0,
    totalEarnings: 0,
    targetPieces: 120,
    targetEarnings: 300,
  });

  useEffect(() => {
    loadWorkQueue();
    loadTodayStats();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadWorkQueue();
      loadTodayStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [filter]);

  const loadWorkQueue = async () => {
    setLoading(true);
    try {
      let workQueueData = [];
      
      // Try loading from Firestore first
      try {
        const workItemsRef = collection(db, COLLECTIONS.WORK_ASSIGNMENTS);
        let q = workItemsRef;
        
        // Filter by operator if user is available
        if (user?.id) {
          q = query(workItemsRef, where('assignedOperator', '==', user.id));
        }
        
        q = query(q, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        workQueueData = snapshot.docs.map((doc, index) => {
          const item = doc.data();
          return {
            id: doc.id,
            bundleId: item.bundleId,
            articleNumber: item.articleNumber || item.article,
            articleName: item.articleName,
            color: item.color,
            size: item.size,
            pieces: item.pieces || item.quantity,
            operation: item.operation || item.currentOperation,
            machineType: item.machineType,
            rate: item.rate,
            estimatedTime: item.estimatedTime,
            priority: item.priority || "Normal",
            status: item.status || "pending",
            assignedAt: item.assignedAt,
            startedAt: item.startedAt,
            progress: item.progress || 0,
            completedPieces: item.completedPieces || 0,
            earnings: item.earnings || 0,
          };
        });
        
        console.log('✅ Loaded work queue from Firestore:', workQueueData.length);
      } catch (firestoreError) {
        console.warn('Failed to load from Firestore, falling back to localStorage:', firestoreError);
        
        // No localStorage fallback - use empty array
        workQueueData = [];
          id: `queue_${String(index + 1).padStart(3, '0')}`,
          bundleId: item.bundleId,
          articleNumber: item.articleNumber,
          articleName: item.articleName,
          color: item.color,
          size: item.size,
          pieces: item.pieces || item.quantity,
          operation: item.operation,
          machineType: item.machineType,
          rate: item.rate,
          estimatedTime: item.estimatedTime,
          priority: item.priority || "Normal",
          status: item.status || "pending",
          assignedAt: item.assignedAt,
          startedAt: item.startedAt,
          progress: item.progress || 0,
          completedPieces: item.completedPieces || 0,
          earnings: item.earnings || 0,
        }));
      }

      // Apply filter
      let filteredQueue = workQueueData;
      
      // Filter by operator's machine speciality first
      if (user && user.speciality) {
        const machineMatches = {
          'overlock': ['ओभरलक', 'Overlock'],
          'flatlock': ['फ्ल्यालक', 'Flatlock'], 
          'single_needle': ['एकल सुई', 'Single Needle'],
          'buttonhole': ['बटनहोल', 'Buttonhole']
        };
        
        const allowedMachineTypes = machineMatches[user.speciality] || [];
        filteredQueue = workQueueData.filter(work => 
          allowedMachineTypes.includes(work.machineType)
        );
      }
      
      // Then apply status filter
      if (filter !== "all") {
        filteredQueue = filteredQueue.filter((work) => work.status === filter);
      }

      setWorkQueue(filteredQueue);
    } catch (error) {
      showNotification(
        isNepali
          ? "कामको लाइन लोड गर्न समस्या भयो"
          : "Failed to load work queue",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTodayStats = async () => {
    try {
      // Simulate API call for today's statistics
      const completedWork = workQueue.filter((w) => w.status === "completed");
      const pendingWork = workQueue.filter((w) => w.status !== "completed");

      setTodayStats({
        totalWork: workQueue.length,
        completed: completedWork.length,
        pending: pendingWork.length,
        totalPieces: completedWork.reduce(
          (sum, w) => sum + w.completedPieces,
          0
        ),
        totalEarnings: completedWork.reduce((sum, w) => sum + w.earnings, 0),
        targetPieces: 120,
        targetEarnings: 300,
      });
    } catch (error) {
      console.error("Failed to load today stats:", error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      in_progress: "bg-blue-100 text-blue-800",
      assigned: "bg-yellow-100 text-yellow-800",
      pending: "bg-gray-100 text-gray-800",
      scheduled: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const texts = {
      in_progress: isNepali ? "चलिरहेको" : "In Progress",
      assigned: isNepali ? "तोकिएको" : "Assigned",
      pending: isNepali ? "पेन्डिङ" : "Pending",
      scheduled: isNepali ? "निर्धारित" : "Scheduled",
      completed: isNepali ? "सम्पन्न" : "Completed",
    };
    return texts[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      उच्च: "text-red-600",
      High: "text-red-600",
      सामान्य: "text-yellow-600",
      Normal: "text-yellow-600",
      कम: "text-green-600",
      Low: "text-green-600",
    };
    return colors[priority] || "text-gray-600";
  };

  const handleWorkAction = (work, action) => {
    switch (action) {
      case "start":
        if (onWorkSelected) {
          onWorkSelected(work);
        }
        break;
      case "continue":
        if (onWorkSelected) {
          onWorkSelected(work);
        }
        break;
      case "view":
        setSelectedWork(work);
        break;
      default:
        break;
    }
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const calculateRemainingTime = (work) => {
    if (work.status === "completed") return 0;

    const completedTime =
      (work.completedPieces / work.pieces) * work.estimatedTime;
    return Math.max(0, work.estimatedTime - completedTime);
  };

  const getTotalEstimatedTime = () => {
    return workQueue
      .filter((w) => w.status !== "completed")
      .reduce((sum, w) => sum + calculateRemainingTime(w), 0);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNepali ? "📋 आजका कामहरू" : "📋 Today's Work Queue"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isNepali
                ? "तपाईंको पूरा दिनको काम"
                : "Your complete day's work schedule"}
            </p>
          </div>
          <button
            onClick={loadWorkQueue}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "🔄" : "↻"} {isNepali ? "रिफ्रेस" : "Refresh"}
          </button>
        </div>

        {/* Today's Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-600 text-sm">
              {isNepali ? "कुल काम:" : "Total Work:"}
            </div>
            <div className="text-blue-800 text-xl font-bold">
              {todayStats.totalWork}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 text-sm">
              {isNepali ? "सम्पन्न:" : "Completed:"}
            </div>
            <div className="text-green-800 text-xl font-bold">
              {todayStats.completed}
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-yellow-600 text-sm">
              {isNepali ? "बाँकी:" : "Pending:"}
            </div>
            <div className="text-yellow-800 text-xl font-bold">
              {todayStats.pending}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-purple-600 text-sm">
              {isNepali ? "टुक्राहरू:" : "Pieces:"}
            </div>
            <div className="text-purple-800 text-xl font-bold">
              {formatNumber(todayStats.totalPieces)}/
              {formatNumber(todayStats.targetPieces)}
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-orange-600 text-sm">
              {isNepali ? "कमाई:" : "Earnings:"}
            </div>
            <div className="text-orange-800 text-xl font-bold">
              {formatCurrency(todayStats.totalEarnings)}
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-indigo-600 text-sm">
              {isNepali ? "बाँकी समय:" : "Time Left:"}
            </div>
            <div className="text-indigo-800 text-xl font-bold">
              {getTotalEstimatedTime()} {isNepali ? "मिनेट" : "min"}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              {
                key: "all",
                label: isNepali ? "सबै" : "All",
                count: workQueue.length,
              },
              {
                key: "in_progress",
                label: isNepali ? "चलिरहेको" : "In Progress",
                count: workQueue.filter((w) => w.status === "in_progress")
                  .length,
              },
              {
                key: "assigned",
                label: isNepali ? "तोकिएको" : "Assigned",
                count: workQueue.filter((w) => w.status === "assigned").length,
              },
              {
                key: "pending",
                label: isNepali ? "पेन्डिङ" : "Pending",
                count: workQueue.filter((w) => w.status === "pending").length,
              },
              {
                key: "scheduled",
                label: isNepali ? "निर्धारित" : "Scheduled",
                count: workQueue.filter((w) => w.status === "scheduled").length,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Work Queue List */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{isNepali ? "लोड गर्दै..." : "Loading work queue..."}</p>
            </div>
          ) : workQueue.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isNepali ? "कुनै काम फेला परेन" : "No work found"}
              </h3>
              <p className="text-gray-500 mb-4">
                {isNepali
                  ? "यो फिल्टरमा कुनै काम छैन"
                  : "No work items match the selected filter"}
              </p>
              {onSelfAssign && (
                <button
                  onClick={onSelfAssign}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {isNepali ? "🎯 काम छनोट गर्नुहोस्" : "🎯 Choose Work"}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {workQueue.map((work) => (
                <div
                  key={work.id}
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {work.articleName}
                        </h3>
                        <span className="text-sm text-gray-500">
                          #{work.articleNumber}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            work.status
                          )}`}
                        >
                          {getStatusText(work.status)}
                        </span>
                        <span
                          className={`text-sm font-medium ${getPriorityColor(
                            work.priority
                          )}`}
                        >
                          {work.priority} {isNepali ? "प्राथमिकता" : "Priority"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">
                            {isNepali ? "काम:" : "Operation:"}
                          </span>
                          <div className="font-medium">{work.operation}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {isNepali ? "रङ/साइज:" : "Color/Size:"}
                          </span>
                          <div className="font-medium">
                            {work.color} / {work.size}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {isNepali ? "टुक्राहरू:" : "Pieces:"}
                          </span>
                          <div className="font-medium">
                            {formatNumber(work.pieces)}{" "}
                            {isNepali ? "वटा" : "pcs"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {isNepali ? "दर:" : "Rate:"}
                          </span>
                          <div className="font-medium">
                            {formatCurrency(work.rate)}/
                            {isNepali ? "टुक्रा" : "pc"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {isNepali ? "समय:" : "Time:"}
                          </span>
                          <div className="font-medium">
                            {work.estimatedTime} {isNepali ? "मिनेट" : "min"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {isNepali ? "कमाई:" : "Earnings:"}
                          </span>
                          <div className="font-medium text-green-600">
                            {formatCurrency(work.pieces * work.rate)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-4 flex flex-col space-y-2">
                      {work.status === "in_progress" && (
                        <button
                          onClick={() => handleWorkAction(work, "continue")}
                          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                        >
                          {isNepali ? "जारी राख्नुहोस्" : "Continue"}
                        </button>
                      )}
                      {work.status === "assigned" && (
                        <button
                          onClick={() => handleWorkAction(work, "start")}
                          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                        >
                          {isNepali ? "सुरु गर्नुहोस्" : "Start Work"}
                        </button>
                      )}
                      {(work.status === "pending" ||
                        work.status === "scheduled") && (
                        <button
                          onClick={() => handleWorkAction(work, "view")}
                          className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                        >
                          {isNepali ? "विवरण" : "View Details"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar (for in-progress work) */}
                  {work.status === "in_progress" && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{isNepali ? "प्रगति:" : "Progress:"}</span>
                        <span>
                          {work.completedPieces}/{work.pieces} ({work.progress}
                          %)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${work.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Time Information */}
                  <div className="flex justify-between text-xs text-gray-500">
                    <div>
                      {work.assignedAt && (
                        <span>
                          {isNepali ? "तोकिएको:" : "Assigned:"}{" "}
                          {formatTime(work.assignedAt)}
                        </span>
                      )}
                      {work.startedAt && (
                        <span className="ml-4">
                          {isNepali ? "सुरु:" : "Started:"}{" "}
                          {formatTime(work.startedAt)}
                        </span>
                      )}
                      {work.scheduledAt && work.status === "scheduled" && (
                        <span>
                          {isNepali ? "निर्धारित:" : "Scheduled:"}{" "}
                          {formatTime(work.scheduledAt)}
                        </span>
                      )}
                    </div>
                    <div>
                      {work.status === "in_progress" && (
                        <span className="text-blue-600">
                          {isNepali ? "बाँकी:" : "Remaining:"}{" "}
                          {calculateRemainingTime(work)}{" "}
                          {isNepali ? "मिनेट" : "min"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Work Detail Modal */}
      {selectedWork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {isNepali ? "काम विवरण" : "Work Details"}
              </h3>
              <button
                onClick={() => setSelectedWork(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">
                    {isNepali ? "लेख:" : "Article:"}
                  </span>
                  <div className="font-medium">
                    {selectedWork.articleName} (#{selectedWork.articleNumber})
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">
                    {isNepali ? "स्थिति:" : "Status:"}
                  </span>
                  <div
                    className={`inline-block px-2 py-1 rounded text-sm ${getStatusColor(
                      selectedWork.status
                    )}`}
                  >
                    {getStatusText(selectedWork.status)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">
                    {isNepali ? "काम:" : "Operation:"}
                  </span>
                  <div className="font-medium">{selectedWork.operation}</div>
                </div>
                <div>
                  <span className="text-gray-500">
                    {isNepali ? "मेसिन:" : "Machine:"}
                  </span>
                  <div className="font-medium">{selectedWork.machineType}</div>
                </div>
                <div>
                  <span className="text-gray-500">
                    {isNepali ? "रङ:" : "Color:"}
                  </span>
                  <div className="font-medium">{selectedWork.color}</div>
                </div>
                <div>
                  <span className="text-gray-500">
                    {isNepali ? "साइज:" : "Size:"}
                  </span>
                  <div className="font-medium">{selectedWork.size}</div>
                </div>
                <div>
                  <span className="text-gray-500">
                    {isNepali ? "टुक्राहरू:" : "Pieces:"}
                  </span>
                  <div className="font-medium">
                    {formatNumber(selectedWork.pieces)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">
                    {isNepali ? "दर:" : "Rate:"}
                  </span>
                  <div className="font-medium">
                    {formatCurrency(selectedWork.rate)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">
                    {isNepali ? "अनुमानित समय:" : "Estimated Time:"}
                  </span>
                  <div className="font-medium">
                    {selectedWork.estimatedTime}{" "}
                    {isNepali ? "मिनेट" : "minutes"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">
                    {isNepali ? "कुल कमाई:" : "Total Earnings:"}
                  </span>
                  <div className="font-medium text-green-600">
                    {formatCurrency(selectedWork.pieces * selectedWork.rate)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedWork(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                >
                  {isNepali ? "बन्द गर्नुहोस्" : "Close"}
                </button>
                {selectedWork.status === "assigned" && (
                  <button
                    onClick={() => {
                      handleWorkAction(selectedWork, "start");
                      setSelectedWork(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    {isNepali ? "काम सुरु गर्नुहोस्" : "Start Work"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkQueue;

// src/components/supervisor/LineMonitoring.jsx
// Real-time monitoring of all 50 operators simultaneously

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { LanguageContext } from "../../contexts/LanguageContext";
import { NotificationContext } from "../../contexts/NotificationContext";

const LineMonitoring = () => {
  const { user } = useContext(AuthContext);
  const { t, isNepali, formatNumber, formatCurrency } =
    useContext(LanguageContext);
  const { showNotification, sendEfficiencyAlert } =
    useContext(NotificationContext);

  const [lineData, setLineData] = useState({
    lineInfo: null,
    stations: [],
    operators: [],
    currentProduction: 0,
    targetProduction: 2800,
    efficiency: 0,
    bottlenecks: [],
  });
  const [loading, setLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [view, setView] = useState("stations"); // stations, operators, analytics
  const [selectedStation, setSelectedStation] = useState(null);
  const [alertSettings, setAlertSettings] = useState({
    idleTimeThreshold: 15, // minutes
    efficiencyThreshold: 75, // percentage
    autoAlerts: true,
  });

  useEffect(() => {
    loadLineData();

    // Set up auto-refresh
    const interval = setInterval(() => {
      loadLineData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const loadLineData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock line data with 50 operators across different stations
      const mockStations = [
        {
          id: "cutting",
          name: isNepali ? "कटिङ स्टेसन" : "Cutting Station",
          type: "cutting",
          capacity: 8,
          activeOperators: 7,
          currentWork: 45,
          targetWork: 50,
          efficiency: 90,
          avgIdleTime: 5,
          bottleneck: false,
        },
        {
          id: "overlock",
          name: isNepali ? "ओभरलक स्टेसन" : "Overlock Station",
          type: "overlock",
          capacity: 15,
          activeOperators: 14,
          currentWork: 380,
          targetWork: 420,
          efficiency: 85,
          avgIdleTime: 8,
          bottleneck: false,
        },
        {
          id: "flatlock",
          name: isNepali ? "फ्ल्यालक स्टेसन" : "Flatlock Station",
          type: "flatlock",
          capacity: 12,
          activeOperators: 11,
          currentWork: 220,
          targetWork: 300,
          efficiency: 73,
          avgIdleTime: 18,
          bottleneck: true,
        },
        {
          id: "single_needle",
          name: isNepali ? "एकल सुई स्टेसन" : "Single Needle Station",
          type: "single_needle",
          capacity: 10,
          activeOperators: 9,
          currentWork: 180,
          targetWork: 200,
          efficiency: 90,
          avgIdleTime: 6,
          bottleneck: false,
        },
        {
          id: "buttonhole",
          name: isNepali ? "बटनहोल स्टेसन" : "Buttonhole Station",
          type: "buttonhole",
          capacity: 3,
          activeOperators: 3,
          currentWork: 45,
          targetWork: 60,
          efficiency: 75,
          avgIdleTime: 12,
          bottleneck: false,
        },
        {
          id: "finishing",
          name: isNepali ? "फिनिसिङ स्टेसन" : "Finishing Station",
          type: "finishing",
          capacity: 8,
          activeOperators: 7,
          currentWork: 95,
          targetWork: 120,
          efficiency: 79,
          avgIdleTime: 10,
          bottleneck: false,
        },
      ];

      const mockOperators = [
        // Overlock operators
        {
          id: "op_001",
          name: isNepali ? "राम सिंह" : "Ram Singh",
          station: "overlock",
          machineId: "OV001",
          status: "working",
          currentWork: {
            bundleId: "bundle_001",
            article: "8085",
            operation: isNepali ? "काँध जोड्ने" : "Shoulder Join",
            pieces: 30,
            completed: 22,
            progress: 73,
          },
          efficiency: 92,
          qualityScore: 96,
          idleTime: 5,
          todayPieces: 85,
          todayEarnings: 237.5,
          lastActivity: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: "op_002",
          name: isNepali ? "सीता देवी" : "Sita Devi",
          station: "flatlock",
          machineId: "FL001",
          status: "working",
          currentWork: {
            bundleId: "bundle_002",
            article: "2233",
            operation: isNepali ? "हेम फोल्ड" : "Hem Fold",
            pieces: 28,
            completed: 15,
            progress: 54,
          },
          efficiency: 88,
          qualityScore: 94,
          idleTime: 3,
          todayPieces: 72,
          todayEarnings: 201.6,
          lastActivity: new Date(Date.now() - 180000).toISOString(),
        },
        {
          id: "op_003",
          name: isNepali ? "हरि बहादुर" : "Hari Bahadur",
          station: "single_needle",
          machineId: "SN001",
          status: "working",
          currentWork: {
            bundleId: "bundle_003",
            article: "6635",
            operation: isNepali ? "प्लाकेट" : "Placket",
            pieces: 40,
            completed: 35,
            progress: 88,
          },
          efficiency: 90,
          qualityScore: 98,
          idleTime: 2,
          todayPieces: 95,
          todayEarnings: 285.0,
          lastActivity: new Date(Date.now() - 120000).toISOString(),
        },
        {
          id: "op_004",
          name: isNepali ? "मिना तामाङ" : "Mina Tamang",
          station: "overlock",
          machineId: "OV002",
          status: "idle",
          currentWork: null,
          efficiency: 78,
          qualityScore: 92,
          idleTime: 25,
          todayPieces: 58,
          todayEarnings: 162.4,
          lastActivity: new Date(Date.now() - 1500000).toISOString(),
        },
        {
          id: "op_005",
          name: isNepali ? "कुमार गुरुङ" : "Kumar Gurung",
          station: "buttonhole",
          machineId: "BH001",
          status: "break",
          currentWork: null,
          efficiency: 85,
          qualityScore: 95,
          idleTime: 15,
          todayPieces: 45,
          todayEarnings: 180.0,
          lastActivity: new Date(Date.now() - 900000).toISOString(),
        },
      ];

      const totalProduction = mockStations.reduce(
        (sum, station) => sum + station.currentWork,
        0
      );
      const totalTarget = mockStations.reduce(
        (sum, station) => sum + station.targetWork,
        0
      );
      const overallEfficiency = Math.round(
        (totalProduction / totalTarget) * 100
      );
      const bottlenecks = mockStations.filter((station) => station.bottleneck);

      setLineData({
        lineInfo: {
          id: "line_1",
          name: isNepali ? "उत्पादन लाइन १" : "Production Line 1",
          shift: "morning",
          startTime: "08:00",
          endTime: "17:00",
        },
        stations: mockStations,
        operators: mockOperators,
        currentProduction: totalProduction,
        targetProduction: totalTarget,
        efficiency: overallEfficiency,
        bottlenecks,
      });

      // Send alerts for idle operators if auto-alerts enabled
      if (alertSettings.autoAlerts) {
        mockOperators.forEach((operator) => {
          if (
            operator.status === "idle" &&
            operator.idleTime >= alertSettings.idleTimeThreshold
          ) {
            sendEfficiencyAlert(
              `${operator.station} (${operator.name})`,
              operator.idleTime
            );
          }
        });
      }
    } catch (error) {
      showNotification(
        isNepali ? "लाइन डेटा लोड गर्न समस्या भयो" : "Failed to load line data",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      working: "bg-green-100 text-green-800",
      idle: "bg-red-100 text-red-800",
      break: "bg-yellow-100 text-yellow-800",
      maintenance: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const texts = {
      working: isNepali ? "काम गर्दै" : "Working",
      idle: isNepali ? "खाली" : "Idle",
      break: isNepali ? "विश्राम" : "Break",
      maintenance: isNepali ? "मर्मत" : "Maintenance",
    };
    return texts[status] || status;
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return "text-green-600";
    if (efficiency >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const handleStationClick = (station) => {
    setSelectedStation(station);
  };

  const handleOperatorAction = async (operatorId, action) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      switch (action) {
        case "assign_work":
          showNotification(
            isNepali
              ? "काम असाइन गर्ने पेज खोल्दै..."
              : "Opening work assignment...",
            "info"
          );
          break;
        case "send_break":
          showNotification(
            isNepali ? "विश्रामको सूचना पठाइयो" : "Break notification sent",
            "success"
          );
          break;
        case "check_quality":
          showNotification(
            isNepali ? "गुणस्तर चेकको लागि पठाइयो" : "Sent for quality check",
            "success"
          );
          break;
        default:
          break;
      }

      // Reload data after action
      loadLineData();
    } catch (error) {
      showNotification(isNepali ? "कार्य असफल भयो" : "Action failed", "error");
    }
  };

  const formatLastActivity = (timestamp) => {
    const minutes = Math.floor(
      (Date.now() - new Date(timestamp).getTime()) / 60000
    );
    return `${minutes} ${isNepali ? "मिनेट अगाडि" : "min ago"}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNepali ? "🏭 लाइन मनिटरिङ" : "🏭 Line Monitoring"}
            </h1>
            <p className="text-gray-600 mt-1">
              {lineData.lineInfo?.name} -{" "}
              {isNepali ? "रियल-टाइम अवस्था" : "Real-time Status"}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">
                {isNepali ? "रिफ्रेस:" : "Refresh:"}
              </label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="15">15s</option>
                <option value="30">30s</option>
                <option value="60">1min</option>
                <option value="300">5min</option>
              </select>
            </div>
            <button
              onClick={loadLineData}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "🔄" : "↻"} {isNepali ? "रिफ्रेस" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Overall Line Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-600 text-sm">
              {isNepali ? "कुल उत्पादन:" : "Total Production:"}
            </div>
            <div className="text-blue-800 text-xl font-bold">
              {formatNumber(lineData.currentProduction)}/
              {formatNumber(lineData.targetProduction)}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 text-sm">
              {isNepali ? "समग्र दक्षता:" : "Overall Efficiency:"}
            </div>
            <div
              className={`text-xl font-bold ${getEfficiencyColor(
                lineData.efficiency
              )}`}
            >
              {lineData.efficiency}%
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-yellow-600 text-sm">
              {isNepali ? "सक्रिय ऑपरेटर:" : "Active Operators:"}
            </div>
            <div className="text-yellow-800 text-xl font-bold">
              {
                lineData.operators.filter((op) => op.status === "working")
                  .length
              }
              /{lineData.operators.length}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-red-600 text-sm">
              {isNepali ? "बाधाहरू:" : "Bottlenecks:"}
            </div>
            <div className="text-red-800 text-xl font-bold">
              {lineData.bottlenecks.length}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-purple-600 text-sm">
              {isNepali ? "खाली ऑपरेटर:" : "Idle Operators:"}
            </div>
            <div className="text-purple-800 text-xl font-bold">
              {lineData.operators.filter((op) => op.status === "idle").length}
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              {
                key: "stations",
                label: isNepali ? "स्टेसनहरू" : "Stations",
                icon: "🏭",
              },
              {
                key: "operators",
                label: isNepali ? "ऑपरेटरहरू" : "Operators",
                icon: "👥",
              },
              {
                key: "analytics",
                label: isNepali ? "एनालिटिक्स" : "Analytics",
                icon: "📊",
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  view === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Stations View */}
        {view === "stations" && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lineData.stations.map((station) => (
                <div
                  key={station.id}
                  className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                    station.bottleneck
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                  onClick={() => handleStationClick(station)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {station.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {station.activeOperators}/{station.capacity}{" "}
                        {isNepali ? "ऑपरेटर" : "operators"}
                      </p>
                    </div>
                    {station.bottleneck && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        {isNepali ? "बाधा" : "Bottleneck"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        {isNepali ? "उत्पादन:" : "Production:"}
                      </span>
                      <span className="font-medium">
                        {formatNumber(station.currentWork)}/
                        {formatNumber(station.targetWork)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        {isNepali ? "दक्षता:" : "Efficiency:"}
                      </span>
                      <span
                        className={`font-medium ${getEfficiencyColor(
                          station.efficiency
                        )}`}
                      >
                        {station.efficiency}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        {isNepali ? "औसत खाली समय:" : "Avg Idle Time:"}
                      </span>
                      <span className="font-medium">
                        {station.avgIdleTime} {isNepali ? "मिनेट" : "min"}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{isNepali ? "प्रगति:" : "Progress:"}</span>
                      <span>
                        {Math.round(
                          (station.currentWork / station.targetWork) * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          station.bottleneck ? "bg-red-400" : "bg-blue-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (station.currentWork / station.targetWork) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Operators View */}
        {view === "operators" && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isNepali ? "ऑपरेटर" : "Operator"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isNepali ? "स्टेसन" : "Station"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isNepali ? "स्थिति" : "Status"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isNepali ? "हालको काम" : "Current Work"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isNepali ? "दक्षता" : "Efficiency"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isNepali ? "आजका टुक्रा" : "Today Pieces"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isNepali ? "कार्यहरू" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lineData.operators.map((operator) => (
                    <tr key={operator.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {operator.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {operator.machineId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {operator.station}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            operator.status
                          )}`}
                        >
                          {getStatusText(operator.status)}
                        </span>
                        {operator.status === "idle" &&
                          operator.idleTime >
                            alertSettings.idleTimeThreshold && (
                            <div className="text-xs text-red-600 mt-1">
                              {operator.idleTime}{" "}
                              {isNepali ? "मिनेट खाली" : "min idle"}
                            </div>
                          )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {operator.currentWork ? (
                          <div>
                            <div className="font-medium">
                              #{operator.currentWork.article}
                            </div>
                            <div className="text-gray-500">
                              {operator.currentWork.operation}
                            </div>
                            <div className="text-xs text-blue-600">
                              {operator.currentWork.completed}/
                              {operator.currentWork.pieces}(
                              {operator.currentWork.progress}%)
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">
                            {isNepali ? "कुनै काम छैन" : "No work"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${getEfficiencyColor(
                            operator.efficiency
                          )}`}
                        >
                          {operator.efficiency}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Q: {operator.qualityScore}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium">
                          {formatNumber(operator.todayPieces)}
                        </div>
                        <div className="text-gray-500">
                          {formatCurrency(operator.todayEarnings)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {operator.status === "idle" && (
                          <button
                            onClick={() =>
                              handleOperatorAction(operator.id, "assign_work")
                            }
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            {isNepali ? "काम दिनुहोस्" : "Assign Work"}
                          </button>
                        )}
                        {operator.status === "working" && (
                          <button
                            onClick={() =>
                              handleOperatorAction(operator.id, "check_quality")
                            }
                            className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700"
                          >
                            {isNepali ? "गुणस्तर चेक" : "Quality Check"}
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleOperatorAction(operator.id, "send_break")
                          }
                          className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
                        >
                          {isNepali ? "विश्राम" : "Break"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {view === "analytics" && (
          <div className="p-6 space-y-6">
            {/* Bottleneck Analysis */}
            {lineData.bottlenecks.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-4">
                  ⚠️ {isNepali ? "बाधा विश्लेषण" : "Bottleneck Analysis"}
                </h3>
                <div className="space-y-4">
                  {lineData.bottlenecks.map((station) => (
                    <div
                      key={station.id}
                      className="bg-white p-4 rounded border"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{station.name}</h4>
                          <p className="text-sm text-gray-600">
                            {isNepali ? "दक्षता:" : "Efficiency:"}{" "}
                            {station.efficiency}% |{" "}
                            {isNepali ? "औसत खाली समय:" : "Avg idle time:"}{" "}
                            {station.avgIdleTime} {isNepali ? "मिनेट" : "min"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {isNepali ? "उत्पादन घाटा:" : "Production deficit:"}
                          </div>
                          <div className="font-medium text-red-600">
                            -
                            {formatNumber(
                              station.targetWork - station.currentWork
                            )}{" "}
                            {isNepali ? "टुक्रा" : "pieces"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Efficiency Trends */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📈 {isNepali ? "दक्षता ट्रेन्ड" : "Efficiency Trends"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">
                    {isNepali
                      ? "स्टेसन अनुसार दक्षता"
                      : "Efficiency by Station"}
                  </h4>
                  <div className="space-y-2">
                    {lineData.stations.map((station) => (
                      <div key={station.id} className="flex items-center">
                        <span className="w-24 text-sm">
                          {station.name.split(" ")[0]}:
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 mx-2">
                          <div
                            className={`h-4 rounded-full ${
                              getEfficiencyColor(station.efficiency).includes(
                                "green"
                              )
                                ? "bg-green-500"
                                : getEfficiencyColor(
                                    station.efficiency
                                  ).includes("yellow")
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${station.efficiency}%` }}
                          ></div>
                        </div>
                        <span className="w-12 text-sm font-medium">
                          {station.efficiency}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">
                    {isNepali ? "शीर्ष प्रदर्शनकर्ता" : "Top Performers"}
                  </h4>
                  <div className="space-y-2">
                    {lineData.operators
                      .filter((op) => op.status === "working")
                      .sort((a, b) => b.efficiency - a.efficiency)
                      .slice(0, 5)
                      .map((operator, index) => (
                        <div key={operator.id} className="flex items-center">
                          <span className="w-6 text-sm">{index + 1}.</span>
                          <span className="flex-1 text-sm">
                            {operator.name}
                          </span>
                          <span className="text-sm font-medium">
                            {operator.efficiency}%
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Alert Settings */}
            <div className="bg-gray-50 border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🔔 {isNepali ? "अलर्ट सेटिङ्स" : "Alert Settings"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isNepali ? "खाली समय थ्रेसहोल्ड:" : "Idle Time Threshold:"}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={alertSettings.idleTimeThreshold}
                      onChange={(e) =>
                        setAlertSettings({
                          ...alertSettings,
                          idleTimeThreshold: parseInt(e.target.value) || 15,
                        })
                      }
                      className="w-20 p-2 border rounded"
                      min="5"
                      max="60"
                    />
                    <span className="text-sm text-gray-600">
                      {isNepali ? "मिनेट" : "minutes"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isNepali ? "दक्षता थ्रेसहोल्ड:" : "Efficiency Threshold:"}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={alertSettings.efficiencyThreshold}
                      onChange={(e) =>
                        setAlertSettings({
                          ...alertSettings,
                          efficiencyThreshold: parseInt(e.target.value) || 75,
                        })
                      }
                      className="w-20 p-2 border rounded"
                      min="50"
                      max="100"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isNepali ? "स्वचालित अलर्ट:" : "Auto Alerts:"}
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={alertSettings.autoAlerts}
                      onChange={(e) =>
                        setAlertSettings({
                          ...alertSettings,
                          autoAlerts: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {isNepali ? "सक्षम" : "Enabled"}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Station Detail Modal */}
      {selectedStation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {selectedStation.name} -{" "}
                {isNepali ? "विस्तृत जानकारी" : "Detailed Information"}
              </h3>
              <button
                onClick={() => setSelectedStation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-blue-600 text-sm">
                  {isNepali ? "क्षमता:" : "Capacity:"}
                </div>
                <div className="text-blue-800 text-lg font-bold">
                  {selectedStation.capacity}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <div className="text-green-600 text-sm">
                  {isNepali ? "सक्रिय:" : "Active:"}
                </div>
                <div className="text-green-800 text-lg font-bold">
                  {selectedStation.activeOperators}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded">
                <div className="text-yellow-600 text-sm">
                  {isNepali ? "दक्षता:" : "Efficiency:"}
                </div>
                <div className="text-yellow-800 text-lg font-bold">
                  {selectedStation.efficiency}%
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <div className="text-red-600 text-sm">
                  {isNepali ? "खाली समय:" : "Idle Time:"}
                </div>
                <div className="text-red-800 text-lg font-bold">
                  {selectedStation.avgIdleTime} {isNepali ? "मिनेट" : "min"}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">
                {isNepali
                  ? "यस स्टेसनका ऑपरेटरहरू:"
                  : "Operators at this station:"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lineData.operators
                  .filter((op) => op.station === selectedStation.type)
                  .map((operator) => (
                    <div key={operator.id} className="border p-4 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{operator.name}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${getStatusColor(
                            operator.status
                          )}`}
                        >
                          {getStatusText(operator.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>
                          {isNepali ? "मेसिन:" : "Machine:"}{" "}
                          {operator.machineId}
                        </div>
                        <div>
                          {isNepali ? "दक्षता:" : "Efficiency:"}{" "}
                          {operator.efficiency}%
                        </div>
                        <div>
                          {isNepali ? "आज:" : "Today:"}{" "}
                          {formatNumber(operator.todayPieces)}{" "}
                          {isNepali ? "टुक्रा" : "pieces"}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedStation(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                {isNepali ? "बन्द गर्नुहोस्" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LineMonitoring;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../hooks/useNotifications';
import WIPImport from "./WIPImport";


const SupervisorDashboard = () => {
  const { user, getUserDisplayInfo } = useAuth();
  const { t, currentLanguage, getTimeBasedGreeting, formatTime } =
    useLanguage();
  const { showWorkNotification } = useNotifications();

  const [lineStatus, setLineStatus] = useState([
    {
      id: "overlock-1",
      station: "ओभरलक स्टेसन १",
      operator: { id: "op1", name: "राम सिंह", initials: "रस" },
      currentWork: {
        bundleId: "B001-85-BL-XL",
        article: "8085",
        operation: "साइड सिम",
        progress: 85,
        timeRemaining: 5,
        pieces: { completed: 25, total: 30 },
      },
      status: "active",
      efficiency: 88,
      lastUpdate: new Date(Date.now() - 2 * 60000),
    },
    {
      id: "flatlock-1",
      station: "फ्ल्यालक स्टेसन १",
      operator: { id: "op2", name: "सीता देवी", initials: "सद" },
      currentWork: {
        bundleId: "B002-33-GR-2XL",
        article: "2233",
        operation: "हेम फोल्ड",
        progress: 60,
        timeRemaining: 12,
        pieces: { completed: 17, total: 28 },
      },
      status: "active",
      efficiency: 92,
      lastUpdate: new Date(Date.now() - 1 * 60000),
    },
    {
      id: "overlock-2",
      station: "ओभरलक स्टेसन २",
      operator: { id: "op3", name: "श्याम पोखरेल", initials: "शप" },
      currentWork: null,
      status: "idle",
      efficiency: 85,
      idleTime: 15,
      lastUpdate: new Date(Date.now() - 15 * 60000),
    },
    {
      id: "single-needle-1",
      station: "एकल सुई स्टेसन १",
      operator: { id: "op4", name: "हरि बहादुर", initials: "हब" },
      currentWork: {
        bundleId: "B004-85-BL-L",
        article: "8085",
        operation: "प्लाकेट",
        progress: 70,
        timeRemaining: 8,
        pieces: { completed: 22, total: 32 },
      },
      status: "active",
      efficiency: 78,
      lastUpdate: new Date(Date.now() - 3 * 60000),
    },
    {
      id: "single-needle-2",
      station: "एकल सुई स्टेसन २",
      operator: { id: "op5", name: "मिना तामाङ", initials: "मत" },
      currentWork: null,
      status: "break",
      efficiency: 65,
      breakTime: 10,
      lastUpdate: new Date(Date.now() - 10 * 60000),
    },
  ]);

  const [productionStats, setProductionStats] = useState({
    today: {
      target: 5000,
      completed: 3750,
      efficiency: 85,
      qualityScore: 96,
      activeOperators: 48,
      totalOperators: 50,
    },
    hourly: [
      { hour: "09:00", pieces: 450, target: 400 },
      { hour: "10:00", pieces: 520, target: 500 },
      { hour: "11:00", pieces: 480, target: 500 },
      { hour: "12:00", pieces: 510, target: 500 },
      { hour: "13:00", pieces: 320, target: 200 }, // lunch
      { hour: "14:00", pieces: 540, target: 500 },
      { hour: "15:00", pieces: 490, target: 500 },
    ],
  });
const [showWIPImport, setShowWIPImport] = useState(false);
const [wipData, setWipData] = useState([]);

const handleWIPImport = (importedData) => {
  console.log("WIP imported:", importedData);

  // Add to available bundles
  setAvailableBundles((prev) => [
    ...prev,
    ...importedData.bundles.slice(0, 10),
  ]);

  // Store WIP data
  setWipData((prev) => [...prev, importedData]);

  setShowWIPImport(false);
};

const handleWIPImportCancel = () => {
  setShowWIPImport(false);
};
  const [availableBundles, setAvailableBundles] = useState([
    {
      id: "B005-88-CR-XL",
      article: "2288",
      articleName: "Full Sleeve T-Shirt",
      color: "क्रिम-१",
      size: "XL",
      pieces: 25,
      operation: "स्लिभ अट्याच",
      machine: "ओभरलक",
      rate: 4.5,
      priority: "high",
      estimatedTime: 90,
      assignedTo: null,
    },
    {
      id: "B006-35-WH-2XL",
      article: "6635",
      articleName: "3-Button Tops",
      color: "सेतो-२",
      size: "2XL",
      pieces: 38,
      operation: "बटनहोल",
      machine: "बटनहोल",
      rate: 1.5,
      priority: "normal",
      estimatedTime: 45,
      assignedTo: null,
    },
    {
      id: "B007-85-BK-L",
      article: "8085",
      articleName: "Polo T-Shirt",
      color: "कालो-१",
      size: "L",
      pieces: 30,
      operation: "कलर अट्याच",
      machine: "एकल सुई",
      rate: 4.5,
      priority: "normal",
      estimatedTime: 120,
      assignedTo: null,
    },
  ]);

  const [qualityIssues, setQualityIssues] = useState([
    {
      id: 1,
      bundleId: "B003-35-WH-L",
      operatorName: "सीता देवी",
      defectType: "कपडामा प्वाल",
      severity: "major",
      affectedPieces: 2,
      status: "open",
      reportedAt: new Date(Date.now() - 30 * 60000),
    },
  ]);

  const [showWorkAssignment, setShowWorkAssignment] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);

  const userInfo = getUserDisplayInfo();
  const currentTime = formatTime(new Date());

  // Calculated stats
  const activeStations = lineStatus.filter(
    (station) => station.status === "active"
  ).length;
  const idleStations = lineStatus.filter(
    (station) => station.status === "idle"
  ).length;
  const avgEfficiency = Math.round(
    lineStatus.reduce((sum, station) => sum + station.efficiency, 0) /
      lineStatus.length
  );

  const handleAssignWork = (bundleId, stationId) => {
    const bundle = availableBundles.find((b) => b.id === bundleId);
    const station = lineStatus.find((s) => s.id === stationId);

    if (bundle && station) {
      // Update bundle assignment
      setAvailableBundles((prev) =>
        prev.map((b) =>
          b.id === bundleId ? { ...b, assignedTo: stationId } : b
        )
      );

      // Update station status
      setLineStatus((prev) =>
        prev.map((s) =>
          s.id === stationId
            ? {
                ...s,
                currentWork: {
                  bundleId: bundle.id,
                  article: bundle.article,
                  operation: bundle.operation,
                  progress: 0,
                  timeRemaining: bundle.estimatedTime,
                  pieces: { completed: 0, total: bundle.pieces },
                },
                status: "active",
                lastUpdate: new Date(),
              }
            : s
        )
      );

      // Send notification to operator
      showWorkNotification({
        bundleId: bundle.id,
        article: bundle.article,
        operation: bundle.operation,
      });

      setShowWorkAssignment(false);
      setSelectedBundle(null);
      setSelectedStation(null);
    }
  };

  const handleOptimizeLine = (stationId) => {
    const station = lineStatus.find((s) => s.id === stationId);
    const suitableBundles = availableBundles.filter((bundle) => {
      if (station.id.includes("overlock")) return bundle.machine === "ओभरलक";
      if (station.id.includes("flatlock")) return bundle.machine === "फ्ल्यालक";
      if (station.id.includes("single-needle"))
        return bundle.machine === "एकल सुई";
      return false;
    });

    if (suitableBundles.length > 0) {
      const priorityBundle =
        suitableBundles.find((b) => b.priority === "high") ||
        suitableBundles[0];
      handleAssignWork(priorityBundle.id, stationId);
    }
  };
if (showWIPImport) {
  return (
    <WIPImport onImport={handleWIPImport} onCancel={handleWIPImportCancel} />
  );
}

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-700 p-3 rounded-lg">
                <span className="text-lg font-medium">
                  {userInfo?.initials}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">
                  {getTimeBasedGreeting()}, {userInfo?.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {t("supervisor")} | उत्पादन विभाग | {currentTime}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {activeStations}
                </p>
                <p className="text-xs text-gray-600">सक्रिय स्टेसन</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {idleStations}
                </p>
                <p className="text-xs text-gray-600">खाली स्टेसन</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {avgEfficiency}%
                </p>
                <p className="text-xs text-gray-600">औसत दक्षता</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Production Overview */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">आजको उत्पादन</p>
                <p className="text-2xl font-bold text-blue-600">
                  {productionStats.today.completed.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  लक्ष्य: {productionStats.today.target.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${
                      (productionStats.today.completed /
                        productionStats.today.target) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">लाइन दक्षता</p>
                <p className="text-2xl font-bold text-green-600">
                  {productionStats.today.efficiency}%
                </p>
                <p className="text-sm text-green-500">+३% गतहप्ता भन्दा</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">गुणस्तर स्कोर</p>
                <p className="text-2xl font-bold text-purple-600">
                  {productionStats.today.qualityScore}%
                </p>
                <p className="text-sm text-purple-500">लक्ष्य: ९५%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">सक्रिय ऑपरेटर</p>
                <p className="text-2xl font-bold text-orange-600">
                  {productionStats.today.activeOperators}/
                  {productionStats.today.totalOperators}
                </p>
                <p className="text-sm text-orange-500">९६% उपस्थिति</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Line Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {currentLanguage === "np"
                ? "रियल-टाइम लाइन स्थिति"
                : "Real-time Line Status"}
            </h2>
            <button
              onClick={() => setShowWorkAssignment(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {currentLanguage === "np" ? "काम असाइन गर्नुहोस्" : "Assign Work"}
            </button>
          </div>
          // In the Real-time Line Status section, update the header:
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {currentLanguage === "np"
                ? "रियल-टाइम लाइन स्थिति"
                : "Real-time Line Status"}
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowWIPImport(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                {currentLanguage === "np" ? "WIP आयात गर्नुहोस्" : "Import WIP"}
              </button>
              <button
                onClick={() => setShowWorkAssignment(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentLanguage === "np"
                  ? "काम असाइन गर्नुहोस्"
                  : "Assign Work"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {lineStatus.map((station) => (
              <div
                key={station.id}
                className={`border-2 rounded-lg p-4 ${
                  station.status === "active"
                    ? "border-green-200 bg-green-50"
                    : station.status === "idle"
                    ? "border-orange-200 bg-orange-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        station.status === "active"
                          ? "bg-green-500 animate-pulse"
                          : station.status === "idle"
                          ? "bg-orange-500"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    <h3 className="font-semibold text-gray-800">
                      {station.station}
                    </h3>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      station.status === "active"
                        ? "bg-green-100 text-green-700"
                        : station.status === "idle"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {station.status === "active"
                      ? "सक्रिय"
                      : station.status === "idle"
                      ? "खाली"
                      : "विश्राम"}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="bg-gray-100 p-1 rounded">
                      <span className="text-xs font-medium">
                        {station.operator.initials}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {station.operator.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    दक्षता: {station.efficiency}%
                  </div>
                </div>

                {station.currentWork ? (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">काम:</span>
                      <span className="ml-1 font-medium">
                        {station.currentWork.operation}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">लेख:</span>
                      <span className="ml-1 font-medium">
                        {station.currentWork.article}#
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">प्रगति:</span>
                      <span className="ml-1 font-medium">
                        {station.currentWork.pieces.completed}/
                        {station.currentWork.pieces.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${station.currentWork.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600">
                      बाँकी: ~{station.currentWork.timeRemaining} मिनेट
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-400 mb-2">
                      <svg
                        className="w-8 h-8 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">
                      {station.status === "idle"
                        ? `${station.idleTime} मिनेट खाली`
                        : `${station.breakTime} मिनेट विश्राम`}
                    </p>
                    {station.status === "idle" && (
                      <button
                        onClick={() => handleOptimizeLine(station.id)}
                        className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                      >
                        काम लोड गर्नुहोस्
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Available Work & Quality Issues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Bundles */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              उपलब्ध बन्डलहरू (
              {availableBundles.filter((b) => !b.assignedTo).length})
            </h2>

            <div className="space-y-3">
              {availableBundles
                .filter((b) => !b.assignedTo)
                .slice(0, 4)
                .map((bundle) => (
                  <div
                    key={bundle.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                          {bundle.article}#
                        </span>
                        {bundle.priority === "high" && (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                            उच्च प्राथमिकता
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        ~{bundle.estimatedTime} मिनेट
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">काम:</span>
                        <span className="ml-1 font-medium">
                          {bundle.operation}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">मेसिन:</span>
                        <span className="ml-1 font-medium">
                          {bundle.machine}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">टुक्रा:</span>
                        <span className="ml-1 font-medium">
                          {bundle.pieces}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">दर:</span>
                        <span className="ml-1 font-medium text-green-600">
                          रु. {bundle.rate}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedBundle(bundle);
                        setShowWorkAssignment(true);
                      }}
                      className="mt-3 w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      असाइन गर्नुहोस्
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Quality Issues */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              गुणस्तर समस्याहरू (
              {qualityIssues.filter((q) => q.status === "open").length})
            </h2>

            <div className="space-y-3">
              {qualityIssues
                .filter((q) => q.status === "open")
                .map((issue) => (
                  <div
                    key={issue.id}
                    className="border border-red-200 bg-red-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            issue.severity === "major"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        ></span>
                        <span className="font-medium text-red-800">
                          {issue.defectType}
                        </span>
                      </div>
                      <span className="text-xs text-red-600">
                        {Math.round(
                          (new Date() - issue.reportedAt) / (1000 * 60)
                        )}{" "}
                        मिनेट अगाडि
                      </span>
                    </div>

                    <div className="text-sm text-red-700 mb-2">
                      बन्डल: {issue.bundleId} | ऑपरेटर: {issue.operatorName}
                    </div>

                    <div className="text-sm text-red-700 mb-3">
                      प्रभावित टुक्रा: {issue.affectedPieces}
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 bg-red-600 text-white py-1 px-3 rounded text-xs hover:bg-red-700 transition-colors">
                        समीक्षा गर्नुहोस्
                      </button>
                      <button className="flex-1 bg-gray-600 text-white py-1 px-3 rounded text-xs hover:bg-gray-700 transition-colors">
                        समाधान गर्नुहोस्
                      </button>
                    </div>
                  </div>
                ))}

              {qualityIssues.filter((q) => q.status === "open").length ===
                0 && (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p>कुनै गुणस्तर समस्या छैन</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Work Assignment Modal */}
      {showWorkAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  काम असाइन गर्नुहोस्
                </h2>
                <button
                  onClick={() => {
                    setShowWorkAssignment(false);
                    setSelectedBundle(null);
                    setSelectedStation(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {/* Bundle Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  बन्डल छान्नुहोस्:
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableBundles
                    .filter((b) => !b.assignedTo)
                    .map((bundle) => (
                      <label
                        key={bundle.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="selectedBundle"
                          value={bundle.id}
                          checked={selectedBundle?.id === bundle.id}
                          onChange={() => setSelectedBundle(bundle)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                              {bundle.article}#
                            </span>
                            <span className="font-medium">
                              {bundle.operation}
                            </span>
                            {bundle.priority === "high" && (
                              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                                उच्च प्राथमिकता
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {bundle.pieces} टुक्रा | {bundle.machine} | रु.{" "}
                            {bundle.rate}/टुक्रा
                          </div>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              {/* Station Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  स्टेसन छान्नुहोस्:
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {lineStatus
                    .filter((station) => {
                      if (!selectedBundle) return station.status === "idle";
                      // Filter compatible stations
                      if (selectedBundle.machine === "ओभरलक")
                        return station.id.includes("overlock");
                      if (selectedBundle.machine === "फ्ल्यालक")
                        return station.id.includes("flatlock");
                      if (selectedBundle.machine === "एकल सुई")
                        return station.id.includes("single-needle");
                      if (selectedBundle.machine === "बटनहोल")
                        return station.id.includes("buttonhole");
                      return false;
                    })
                    .map((station) => (
                      <label
                        key={station.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                          station.status === "idle"
                            ? "border-green-200 hover:bg-green-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedStation"
                          value={station.id}
                          checked={selectedStation === station.id}
                          onChange={() => setSelectedStation(station.id)}
                          className="mr-3"
                          disabled={
                            station.status !== "idle" && !station.currentWork
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                station.status === "active"
                                  ? "bg-green-500"
                                  : station.status === "idle"
                                  ? "bg-orange-500"
                                  : "bg-gray-400"
                              }`}
                            ></span>
                            <span className="font-medium">
                              {station.station}
                            </span>
                            <span className="text-sm text-gray-600">
                              ({station.operator.name})
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            दक्षता: {station.efficiency}% |
                            {station.status === "idle"
                              ? ` ${station.idleTime} मिनेट खाली`
                              : station.status === "active"
                              ? " काम चलिरहेको"
                              : " विश्राममा"}
                          </div>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              {/* Assignment Summary */}
              {selectedBundle && selectedStation && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">
                    असाइनमेन्ट सारांश:
                  </h4>
                  <div className="text-sm text-blue-700">
                    <p>
                      <strong>बन्डल:</strong> {selectedBundle.article}#{" "}
                      {selectedBundle.operation}
                    </p>
                    <p>
                      <strong>स्टेसन:</strong>{" "}
                      {
                        lineStatus.find((s) => s.id === selectedStation)
                          ?.station
                      }
                    </p>
                    <p>
                      <strong>ऑपरेटर:</strong>{" "}
                      {
                        lineStatus.find((s) => s.id === selectedStation)
                          ?.operator.name
                      }
                    </p>
                    <p>
                      <strong>अनुमानित समय:</strong>{" "}
                      {selectedBundle.estimatedTime} मिनेट
                    </p>
                    <p>
                      <strong>कुल कमाई:</strong> रु.{" "}
                      {(selectedBundle.pieces * selectedBundle.rate).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowWorkAssignment(false);
                    setSelectedBundle(null);
                    setSelectedStation(null);
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  onClick={() => {
                    if (selectedBundle && selectedStation) {
                      handleAssignWork(selectedBundle.id, selectedStation);
                    }
                  }}
                  disabled={!selectedBundle || !selectedStation}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  असाइन गर्नुहोस्
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorDashboard;
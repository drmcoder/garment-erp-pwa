// src/components/operator/SelfAssignmentSystem.jsx
// Complete Operator Self-Assignment System with Smart Recommendations

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { LanguageContext } from "../../context/LanguageContext";
import { NotificationContext } from "../../context/NotificationContext";

const SelfAssignmentSystem = () => {
  const { user } = useContext(AuthContext);
  const { t, isNepali } = useContext(LanguageContext);
  const { showNotification } = useContext(NotificationContext);

  const [availableWork, setAvailableWork] = useState([]);
  const [selectedWork, setSelectedWork] = useState(null);
  const [operationTypes, setOperationTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    machineType: "all",
    priority: "all",
    articleType: "all",
  });

  // Mock data for demonstration - in real app, fetch from Firebase
  const mockAvailableWork = [
    {
      id: "bundle_001",
      articleNumber: "8085",
      articleName: "नीलो टी-शर्ट",
      englishName: "Blue T-Shirt",
      color: "नीलो-१",
      size: "XL",
      pieces: 30,
      operation: "काँध जोड्ने",
      englishOperation: "Shoulder Join",
      machineType: "ओभरलक",
      englishMachine: "Overlock",
      rate: 2.5,
      estimatedTime: 25,
      priority: "सामान्य",
      englishPriority: "Normal",
      difficulty: "सजिलो",
      englishDifficulty: "Easy",
      recommendations: {
        match: 95,
        reasons: ["तपाईंको विशेषता", "उच्च दर", "सजिलो काम"],
      },
    },
    {
      id: "bundle_002",
      articleNumber: "2233",
      articleName: "हरियो पोलो",
      englishName: "Green Polo",
      color: "हरियो-२",
      size: "2XL",
      pieces: 28,
      operation: "हेम फोल्ड",
      englishOperation: "Hem Fold",
      machineType: "फ्ल्यालक",
      englishMachine: "Flatlock",
      rate: 2.8,
      estimatedTime: 20,
      priority: "उच्च",
      englishPriority: "High",
      difficulty: "मध्यम",
      englishDifficulty: "Medium",
      recommendations: {
        match: 88,
        reasons: ["राम्रो दर", "छिटो काम", "उच्च प्राथमिकता"],
      },
    },
    {
      id: "bundle_003",
      articleNumber: "6635",
      articleName: "सेतो शर्ट",
      englishName: "White Shirt",
      color: "सेतो",
      size: "L",
      pieces: 40,
      operation: "प्लाकेट",
      englishOperation: "Placket",
      machineType: "एकल सुई",
      englishMachine: "Single Needle",
      rate: 1.9,
      estimatedTime: 50,
      priority: "कम",
      englishPriority: "Low",
      difficulty: "कठिन",
      englishDifficulty: "Hard",
      recommendations: {
        match: 65,
        reasons: ["नयाँ सिप सिक्न", "लामो अभ्यास"],
      },
    },
  ];

  const mockOperationTypes = [
    {
      id: "shoulder_join",
      nepali: "काँध जोड्ने",
      english: "Shoulder Join",
      machine: "ओभरलक",
    },
    {
      id: "hem_fold",
      nepali: "हेम फोल्ड",
      english: "Hem Fold",
      machine: "फ्ल्यालक",
    },
    {
      id: "side_seam",
      nepali: "साइड सिम",
      english: "Side Seam",
      machine: "ओभरलक",
    },
    {
      id: "placket",
      nepali: "प्लाकेट",
      english: "Placket",
      machine: "एकल सुई",
    },
    { id: "armhole", nepali: "आर्महोल", english: "Armhole", machine: "ओभरलक" },
    {
      id: "neckline",
      nepali: "नेकलाइन",
      english: "Neckline",
      machine: "फ्ल्यालक",
    },
  ];

  useEffect(() => {
    loadAvailableWork();
    loadOperationTypes();
  }, [filter]);

  const loadAvailableWork = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Apply filters
      let filteredWork = mockAvailableWork;
      
      // Filter by operator's machine speciality first
      if (user && user.speciality) {
        const machineMatches = {
          'overlock': ['ओभरलक', 'Overlock'],
          'flatlock': ['फ्ल्यालक', 'Flatlock'], 
          'single_needle': ['एकल सुई', 'Single Needle'],
          'buttonhole': ['बटनहोल', 'Buttonhole']
        };
        
        const allowedMachineTypes = machineMatches[user.speciality] || [];
        filteredWork = filteredWork.filter(work => 
          allowedMachineTypes.includes(work.machineType) || 
          allowedMachineTypes.includes(work.englishMachine)
        );
      }

      if (filter.machineType !== "all") {
        filteredWork = filteredWork.filter(
          (work) => work.machineType === filter.machineType
        );
      }

      if (filter.priority !== "all") {
        filteredWork = filteredWork.filter(
          (work) => work.priority === filter.priority
        );
      }

      // Sort by recommendation match score
      filteredWork.sort(
        (a, b) => b.recommendations.match - a.recommendations.match
      );

      setAvailableWork(filteredWork);
    } catch (error) {
      showNotification("काम लोड गर्न समस्या भयो", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadOperationTypes = () => {
    setOperationTypes(mockOperationTypes);
  };

  const handleWorkSelection = (work) => {
    setSelectedWork(work);
  };

  const handleSelfAssign = async () => {
    if (!selectedWork) return;

    setLoading(true);
    try {
      // Simulate API call to assign work
      await new Promise((resolve) => setTimeout(resolve, 1500));

      showNotification(
        isNepali
          ? `काम स्वीकार गरियो! लेख ${selectedWork.articleNumber} - ${selectedWork.operation}`
          : `Work accepted! Article ${selectedWork.articleNumber} - ${selectedWork.englishOperation}`,
        "success"
      );

      // Reset selection and reload available work
      setSelectedWork(null);
      loadAvailableWork();
    } catch (error) {
      showNotification(
        isNepali ? "काम असाइन गर्न समस्या भयो" : "Failed to assign work",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const priorities = {
      उच्च: "text-red-600 bg-red-50",
      High: "text-red-600 bg-red-50",
      सामान्य: "text-yellow-600 bg-yellow-50",
      Normal: "text-yellow-600 bg-yellow-50",
      कम: "text-green-600 bg-green-50",
      Low: "text-green-600 bg-green-50",
    };
    return priorities[priority] || "text-gray-600 bg-gray-50";
  };

  const getMatchColor = (match) => {
    if (match >= 90) return "text-green-600 bg-green-50";
    if (match >= 75) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNepali ? "🎯 काम छनोट गर्नुहोस्" : "🎯 Choose Your Work"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isNepali
                ? "आफ्नो क्षमता अनुसार उपयुक्त काम छनोट गर्नुहोस्"
                : "Choose suitable work based on your skills"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {isNepali ? "उपलब्ध काम" : "Available Work"}
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {availableWork.length}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">
              {isNepali ? "🔍 फिल्टर गर्नुहोस्" : "🔍 Filter Work"}
            </h3>

            {/* Machine Type Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {isNepali ? "मेसिनको प्रकार" : "Machine Type"}
              </label>
              <select
                value={filter.machineType}
                onChange={(e) =>
                  setFilter({ ...filter, machineType: e.target.value })
                }
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">
                  {isNepali ? "सबै मेसिन" : "All Machines"}
                </option>
                <option value="ओभरलक">{isNepali ? "ओभरलक" : "Overlock"}</option>
                <option value="फ्ल्यालक">
                  {isNepali ? "फ्ल्यालक" : "Flatlock"}
                </option>
                <option value="एकल सुई">
                  {isNepali ? "एकल सुई" : "Single Needle"}
                </option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {isNepali ? "प्राथमिकता" : "Priority"}
              </label>
              <select
                value={filter.priority}
                onChange={(e) =>
                  setFilter({ ...filter, priority: e.target.value })
                }
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">
                  {isNepali ? "सबै प्राथमिकता" : "All Priorities"}
                </option>
                <option value="उच्च">
                  {isNepali ? "उच्च प्राथमिकता" : "High Priority"}
                </option>
                <option value="सामान्य">
                  {isNepali ? "सामान्य प्राथमिकता" : "Normal Priority"}
                </option>
                <option value="कम">
                  {isNepali ? "कम प्राथमिकता" : "Low Priority"}
                </option>
              </select>
            </div>

            {/* Quick Operation Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {isNepali ? "मेरो विशेषता" : "My Specialty"}
              </label>
              <div className="space-y-2">
                {operationTypes.slice(0, 4).map((op) => (
                  <button
                    key={op.id}
                    onClick={() => setFilter({ ...filter, operation: op.id })}
                    className="w-full text-left p-2 text-sm rounded border hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {isNepali ? op.nepali : op.english}
                    <span className="text-xs text-gray-500 block">
                      {op.machine}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadAvailableWork}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isNepali ? "लोड गर्दै..." : "Loading..."}
                </div>
              ) : isNepali ? (
                "🔄 नयाँ काम खोज्नुहोस्"
              ) : (
                "🔄 Refresh Work"
              )}
            </button>
          </div>
        </div>

        {/* Available Work List */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>{isNepali ? "काम लोड गर्दै..." : "Loading work..."}</p>
              </div>
            ) : availableWork.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg border">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isNepali ? "कुनै काम उपलब्ध छैन" : "No work available"}
                </h3>
                <p className="text-gray-500">
                  {isNepali
                    ? "फिल्टर परिवर्तन गर्नुहोस् वा पछि प्रयास गर्नुहोस्"
                    : "Try changing filters or check back later"}
                </p>
              </div>
            ) : (
              availableWork.map((work) => (
                <div
                  key={work.id}
                  className={`bg-white rounded-lg border p-6 transition-all duration-200 cursor-pointer hover:shadow-md ${
                    selectedWork?.id === work.id
                      ? "ring-2 ring-blue-500 shadow-md"
                      : ""
                  }`}
                  onClick={() => handleWorkSelection(work)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {isNepali ? work.articleName : work.englishName}
                        </h3>
                        <span className="text-sm text-gray-500">
                          #{work.articleNumber}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                            isNepali ? work.priority : work.englishPriority
                          )}`}
                        >
                          {isNepali ? work.priority : work.englishPriority}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">
                            {isNepali ? "काम:" : "Operation:"}
                          </span>
                          <div className="font-medium">
                            {isNepali ? work.operation : work.englishOperation}
                          </div>
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
                            {work.pieces} {isNepali ? "वटा" : "pcs"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {isNepali ? "मेसिन:" : "Machine:"}
                          </span>
                          <div className="font-medium">
                            {isNepali ? work.machineType : work.englishMachine}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation Score */}
                    <div
                      className={`ml-4 px-3 py-2 rounded-lg text-center ${getMatchColor(
                        work.recommendations.match
                      )}`}
                    >
                      <div className="text-lg font-bold">
                        {work.recommendations.match}%
                      </div>
                      <div className="text-xs">
                        {isNepali ? "मिल्छ" : "Match"}
                      </div>
                    </div>
                  </div>

                  {/* Work Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">💰</span>
                      <div>
                        <div className="text-gray-500">
                          {isNepali ? "दर:" : "Rate:"}
                        </div>
                        <div className="font-semibold">
                          रु. {work.rate}/{isNepali ? "टुक्रा" : "pc"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">⏱️</span>
                      <div>
                        <div className="text-gray-500">
                          {isNepali ? "समय:" : "Time:"}
                        </div>
                        <div className="font-semibold">
                          {work.estimatedTime} {isNepali ? "मिनेट" : "min"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-600">💪</span>
                      <div>
                        <div className="text-gray-500">
                          {isNepali ? "कठिनाई:" : "Difficulty:"}
                        </div>
                        <div className="font-semibold">
                          {isNepali ? work.difficulty : work.englishDifficulty}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-orange-600">🎯</span>
                      <div>
                        <div className="text-gray-500">
                          {isNepali ? "कमाई:" : "Earnings:"}
                        </div>
                        <div className="font-semibold">
                          रु. {(work.pieces * work.rate).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-gray-50 rounded-md p-3 mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {isNepali ? "🤖 AI सुझाव:" : "🤖 AI Recommendations:"}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {work.recommendations.reasons.map((reason, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {isNepali
                        ? "क्लिक गरेर छनोट गर्नुहोस्"
                        : "Click to select this work"}
                    </div>
                    {selectedWork?.id === work.id && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <span className="text-sm font-medium">
                          {isNepali ? "छनोट गरिएको" : "Selected"}
                        </span>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Confirm Assignment Button */}
          {selectedWork && (
            <div className="mt-6 bg-white rounded-lg border p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {isNepali
                      ? "✅ काम पुष्टि गर्नुहोस्"
                      : "✅ Confirm Work Assignment"}
                  </h3>
                  <p className="text-gray-600">
                    {isNepali
                      ? `${selectedWork.articleName} - ${selectedWork.operation}`
                      : `${selectedWork.englishName} - ${selectedWork.englishOperation}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {isNepali ? "कुल कमाई" : "Total Earnings"}
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    रु. {(selectedWork.pieces * selectedWork.rate).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleSelfAssign}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isNepali ? "असाइन गर्दै..." : "Assigning..."}
                    </div>
                  ) : isNepali ? (
                    "🎯 काम स्वीकार गर्नुहोस्"
                  ) : (
                    "🎯 Accept This Work"
                  )}
                </button>
                <button
                  onClick={() => setSelectedWork(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
                </button>
              </div>

              <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                💡{" "}
                {isNepali
                  ? "टिप: यो काम स्वीकार गरेपछि तुरुन्त तपाईंको कामको सूचीमा थपिनेछ।"
                  : "Tip: After accepting this work, it will be immediately added to your work queue."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelfAssignmentSystem;

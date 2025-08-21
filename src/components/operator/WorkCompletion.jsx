import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../hooks/useNotifications";

const WorkCompletion = ({ workData, onComplete, onCancel }) => {
  const { user } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const { showWorkNotification } = useNotifications();

  const [completionData, setCompletionData] = useState({
    completedPieces: workData?.totalPieces || 0,
    defectivePieces: 0,
    qualityStatus: "good",
    qualityNotes: "",
    actualTimeSpent: 0,
    reworkRequired: false,
  });

  const [timeSpent, setTimeSpent] = useState(0);
  const [showQualityForm, setShowQualityForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Calculate actual time spent
  useEffect(() => {
    if (workData?.startTime) {
      const startTime = new Date(workData.startTime);
      const now = new Date();
      const minutes = Math.round((now - startTime) / (1000 * 60));
      setTimeSpent(minutes);
      setCompletionData((prev) => ({
        ...prev,
        actualTimeSpent: minutes,
      }));
    }
  }, [workData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCompletionData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseInt(value) || 0
          : value,
    }));

    // Clear validation errors
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (completionData.completedPieces <= 0) {
      errors.completedPieces =
        currentLanguage === "np"
          ? "पूरा भएको टुक्रा संख्या आवश्यक छ"
          : "Completed pieces required";
    }

    if (completionData.completedPieces > workData.totalPieces) {
      errors.completedPieces =
        currentLanguage === "np"
          ? "तोकिएको भन्दा बढी टुक्रा हुन सक्दैन"
          : "Cannot exceed assigned pieces";
    }

    if (completionData.defectivePieces < 0) {
      errors.defectivePieces =
        currentLanguage === "np"
          ? "दोषयुक्त टुक्रा संख्या ०/माथि हुनुपर्छ"
          : "Defective pieces must be 0 or more";
    }

    if (completionData.defectivePieces > completionData.completedPieces) {
      errors.defectivePieces =
        currentLanguage === "np"
          ? "दोषयुक्त टुक्रा पूरा भएको भन्दा बढी हुन सक्दैन"
          : "Defective pieces cannot exceed completed pieces";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const finalData = {
      ...completionData,
      workId: workData.id,
      operatorId: user.id,
      completedBy: user.name,
      completionTime: new Date().toISOString(),
      totalEarnings:
        (completionData.completedPieces - completionData.defectivePieces) *
        workData.rate,
      efficiency: Math.round(
        (workData.estimatedTime / completionData.actualTimeSpent) * 100
      ),
    };

    // Show success notification
    await showWorkNotification({
      bundleId: workData.bundleNumber,
      article: workData.article,
      status: "completed",
    });

    onComplete(finalData);
  };

  const goodPieces =
    completionData.completedPieces - completionData.defectivePieces;
  const totalEarnings = goodPieces * workData.rate;
  const defectPercentage =
    completionData.completedPieces > 0
      ? Math.round(
          (completionData.defectivePieces / completionData.completedPieces) *
            100
        )
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="flex items-center space-x-3 mb-4">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {currentLanguage === "np"
                  ? "काम पूरा गर्नुहोस्"
                  : "Complete Work"}
              </h1>
              <p className="text-sm text-gray-600">
                {workData.article}# {workData.articleName}
              </p>
            </div>
          </div>

          {/* Work Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">
                  {currentLanguage === "np" ? "काम" : "Operation"}:
                </span>
                <span className="ml-2 font-medium">{workData.operation}</span>
              </div>
              <div>
                <span className="text-gray-600">
                  {currentLanguage === "np" ? "मेसिन" : "Machine"}:
                </span>
                <span className="ml-2 font-medium">{workData.machine}</span>
              </div>
              <div>
                <span className="text-gray-600">
                  {currentLanguage === "np" ? "रङ/साइज" : "Color/Size"}:
                </span>
                <span className="ml-2 font-medium">
                  {workData.color} / {workData.size}
                </span>
              </div>
              <div>
                <span className="text-gray-600">
                  {currentLanguage === "np" ? "समय" : "Time Spent"}:
                </span>
                <span className="ml-2 font-medium">
                  {timeSpent} {currentLanguage === "np" ? "मिनेट" : "minutes"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Completion Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pieces Completion */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {currentLanguage === "np" ? "काम विवरण" : "Work Details"}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLanguage === "np"
                    ? "तोकिएको टुक्रा"
                    : "Assigned Pieces"}
                </label>
                <input
                  type="number"
                  value={workData.totalPieces}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLanguage === "np"
                    ? "पूरा भएको टुक्रा"
                    : "Completed Pieces"}{" "}
                  *
                </label>
                <input
                  type="number"
                  name="completedPieces"
                  value={completionData.completedPieces}
                  onChange={handleInputChange}
                  min="0"
                  max={workData.totalPieces}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.completedPieces
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  required
                />
                {validationErrors.completedPieces && (
                  <p className="text-red-600 text-sm mt-1">
                    {validationErrors.completedPieces}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLanguage === "np"
                    ? "दोषयुक्त टुक्रा"
                    : "Defective Pieces"}
                </label>
                <input
                  type="number"
                  name="defectivePieces"
                  value={completionData.defectivePieces}
                  onChange={handleInputChange}
                  min="0"
                  max={completionData.completedPieces}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.defectivePieces
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                />
                {validationErrors.defectivePieces && (
                  <p className="text-red-600 text-sm mt-1">
                    {validationErrors.defectivePieces}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLanguage === "np" ? "राम्रो टुक्रा" : "Good Pieces"}
                </label>
                <input
                  type="number"
                  value={goodPieces}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 font-semibold text-green-600"
                />
              </div>
            </div>
          </div>

          {/* Quality Assessment */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {currentLanguage === "np"
                ? "गुणस्तर मूल्याङ्कन"
                : "Quality Assessment"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLanguage === "np"
                    ? "गुणस्तरको स्थिति"
                    : "Quality Status"}
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="qualityStatus"
                      value="good"
                      checked={completionData.qualityStatus === "good"}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-green-600">
                      ✅ {currentLanguage === "np" ? "राम्रो" : "Good"}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="qualityStatus"
                      value="issues"
                      checked={completionData.qualityStatus === "issues"}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-orange-600">
                      ⚠️ {currentLanguage === "np" ? "समस्या छ" : "Has Issues"}
                    </span>
                  </label>
                </div>
              </div>

              {completionData.qualityStatus === "issues" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLanguage === "np"
                      ? "गुणस्तर टिप्पणी"
                      : "Quality Notes"}
                  </label>
                  <textarea
                    name="qualityNotes"
                    value={completionData.qualityNotes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      currentLanguage === "np"
                        ? "समस्याको विवरण लेख्नुहोस्..."
                        : "Describe the quality issues..."
                    }
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="reworkRequired"
                  checked={completionData.reworkRequired}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  {currentLanguage === "np"
                    ? "पुनः काम आवश्यक छ"
                    : "Rework Required"}
                </label>
              </div>
            </div>
          </div>

          {/* Earnings Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {currentLanguage === "np" ? "कमाईको हिसाब" : "Earnings Summary"}
            </h2>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-600">
                    {currentLanguage === "np"
                      ? "दर प्रति टुक्रा"
                      : "Rate per piece"}
                    :
                  </span>
                  <span className="ml-2 font-semibold">
                    रु. {workData.rate}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {currentLanguage === "np" ? "राम्रो टुक्रा" : "Good pieces"}
                    :
                  </span>
                  <span className="ml-2 font-semibold">{goodPieces}</span>
                </div>
                {defectPercentage > 0 && (
                  <div className="col-span-2">
                    <span className="text-orange-600">
                      {currentLanguage === "np" ? "दोष दर" : "Defect rate"}:
                    </span>
                    <span className="ml-2 font-semibold">
                      {defectPercentage}%
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-green-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">
                    {currentLanguage === "np" ? "जम्मा कमाई" : "Total Earnings"}
                    :
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    रु. {totalEarnings.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Step Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {currentLanguage === "np" ? "अर्को चरण" : "Next Step"}
            </h2>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5-5 5M6 12h12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {currentLanguage === "np"
                      ? "यो बन्डल अर्को स्टेसनमा जान्छ"
                      : "This bundle will go to next station"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {currentLanguage === "np" ? "अर्को काम" : "Next operation"}:{" "}
                    {workData.nextOperation || "माथिल्लो सिलाई"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {currentLanguage === "np" ? "अर्को मेसिन" : "Next machine"}:{" "}
                    {workData.nextMachine || "फ्ल्यालक"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {currentLanguage === "np" ? "रद्द गर्नुहोस्" : "Cancel"}
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              {currentLanguage === "np"
                ? "पूरा गरेर पठाउनुहोस्"
                : "Complete & Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkCompletion;

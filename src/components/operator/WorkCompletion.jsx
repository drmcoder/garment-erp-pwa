import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  X,
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  ArrowRight,
  Users,
  Target,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const WorkCompletion = ({ currentWork, onClose, onComplete }) => {
  const { t, currentLanguage, formatNumber, getSizeLabel } = useLanguage();

  const [formData, setFormData] = useState({
    completedPieces: currentWork?.pieces || 0,
    defectivePieces: 0,
    qualityGood: true,
    qualityNotes: "",
    actualTimeSpent: 0,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Calculate actual time spent if work was started
    if (currentWork?.startTime) {
      const timeSpent = Math.round(
        (new Date() - new Date(currentWork.startTime)) / (1000 * 60)
      );
      setFormData((prev) => ({ ...prev, actualTimeSpent: timeSpent }));
    }
  }, [currentWork]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.completedPieces < 0) {
      newErrors.completedPieces =
        currentLanguage === "np"
          ? "पूरा भएको टुक्रा ० भन्दा कम हुन सक्दैन"
          : "Completed pieces cannot be negative";
    }

    if (formData.completedPieces > currentWork.pieces) {
      newErrors.completedPieces =
        currentLanguage === "np"
          ? "पूरा भएको टुक्रा तोकिएको भन्दा बढी हुन सक्दैन"
          : "Completed pieces cannot exceed assigned pieces";
    }

    if (formData.defectivePieces < 0) {
      newErrors.defectivePieces =
        currentLanguage === "np"
          ? "दोषयुक्त टुक्रा ० भन्दा कम हुन सक्दैन"
          : "Defective pieces cannot be negative";
    }

    if (formData.defectivePieces > formData.completedPieces) {
      newErrors.defectivePieces =
        currentLanguage === "np"
          ? "दोषयुक्त टुक्रा पूरा भएको भन्दा बढी हुन सक्दैन"
          : "Defective pieces cannot exceed completed pieces";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const completionData = {
        ...formData,
        bundleId: currentWork.id,
        completedAt: new Date(),
        qualityScore: formData.qualityGood
          ? Math.round(
              ((formData.completedPieces - formData.defectivePieces) /
                formData.completedPieces) *
                100
            )
          : 70,
        earnings: formData.completedPieces * currentWork.rate,
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onComplete(completionData);
    } catch (error) {
      console.error("Error completing work:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEarnings = () => {
    return (formData.completedPieces * currentWork.rate).toFixed(2);
  };

  const getQualityPercentage = () => {
    if (formData.completedPieces === 0) return 100;
    return Math.round(
      ((formData.completedPieces - formData.defectivePieces) /
        formData.completedPieces) *
        100
    );
  };

  if (!currentWork) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            {t("completeWork")}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Work Info */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-800 mb-2">
              ✅ {currentWork.article}# {currentWork.articleName}
            </div>
            <div className="text-sm text-blue-700">
              {t(currentWork.operation)} ({t(currentWork.machine)})
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {t("bundle")}: #{currentWork.id} | {t("color")}:{" "}
              {currentWork.color} |{t("size")}:{" "}
              {getSizeLabel(currentWork.article, currentWork.size)}
            </div>
          </div>

          {/* Completion Form */}
          <div className="space-y-4">
            {/* Work Details */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                <Package className="w-4 h-4 mr-2" />
                📝 {t("workStatus")}
              </h3>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block text-gray-600 mb-1">
                    {t("assigned")} {t("pieces")}
                  </label>
                  <div className="font-medium text-lg">
                    {formatNumber(currentWork.pieces)}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">
                    {t("rate")} / {t("pieces")}
                  </label>
                  <div className="font-medium text-lg">
                    रु. {currentWork.rate}
                  </div>
                </div>
              </div>
            </div>

            {/* Completed Pieces */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("completedPieces")}:
              </label>
              <input
                type="number"
                min="0"
                max={currentWork.pieces}
                value={formData.completedPieces}
                onChange={(e) =>
                  handleInputChange(
                    "completedPieces",
                    parseInt(e.target.value) || 0
                  )
                }
                className={`w-full p-3 border rounded-lg text-center text-lg font-medium ${
                  errors.completedPieces
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 focus:border-blue-500"
                } focus:ring-2 focus:ring-blue-200`}
                placeholder="30"
              />
              {errors.completedPieces && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors.completedPieces}
                </p>
              )}
            </div>

            {/* Defective Pieces */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("defective")} {t("pieces")}:
              </label>
              <input
                type="number"
                min="0"
                max={formData.completedPieces}
                value={formData.defectivePieces}
                onChange={(e) =>
                  handleInputChange(
                    "defectivePieces",
                    parseInt(e.target.value) || 0
                  )
                }
                className={`w-full p-3 border rounded-lg text-center text-lg font-medium ${
                  errors.defectivePieces
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 focus:border-blue-500"
                } focus:ring-2 focus:ring-blue-200`}
                placeholder="0"
              />
              {errors.defectivePieces && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors.defectivePieces}
                </p>
              )}
            </div>

            {/* Quality Assessment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("quality")}:
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="quality"
                    checked={formData.qualityGood}
                    onChange={() => handleInputChange("qualityGood", true)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm">✅ {t("qualityGood")}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="quality"
                    checked={!formData.qualityGood}
                    onChange={() => handleInputChange("qualityGood", false)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm">⚠️ {t("qualityBad")}</span>
                </label>
              </div>
            </div>

            {/* Quality Notes (if issues) */}
            {!formData.qualityGood && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("qualityNotes")}:
                </label>
                <textarea
                  value={formData.qualityNotes}
                  onChange={(e) =>
                    handleInputChange("qualityNotes", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  rows={3}
                  placeholder={
                    currentLanguage === "np"
                      ? "समस्याको विवरण लेख्नुहोस्..."
                      : "Describe the quality issues..."
                  }
                />
              </div>
            )}

            {/* Time Spent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("actualTimeSpent")} ({t("minutes")}):
              </label>
              <input
                type="number"
                min="1"
                value={formData.actualTimeSpent}
                onChange={(e) =>
                  handleInputChange(
                    "actualTimeSpent",
                    parseInt(e.target.value) || 0
                  )
                }
                className="w-full p-3 border border-gray-300 rounded-lg text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="45"
              />
            </div>
          </div>

          {/* Earnings Calculation */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-3 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              💰 {t("earnings")} {t("calculation")}
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">{t("rate")}:</span>
                <span className="font-medium">
                  रु. {currentWork.rate} {t("ratePerPiece")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">{t("completedPieces")}:</span>
                <span className="font-medium">
                  {formatNumber(formData.completedPieces)} {t("pieces")}
                </span>
              </div>
              <div className="border-t border-green-200 pt-2 flex justify-between">
                <span className="font-medium text-green-800">
                  {t("totalEarnings")}:
                </span>
                <span className="font-bold text-lg text-green-800">
                  रु. {calculateEarnings()}
                </span>
              </div>

              {/* Quality Score */}
              <div className="flex justify-between">
                <span className="text-green-700">{t("qualityScore")}:</span>
                <span className="font-medium">
                  {formatNumber(getQualityPercentage())}%
                </span>
              </div>
            </div>
          </div>

          {/* Next Operation Info */}
          {currentWork.nextOperation && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-3 flex items-center">
                <ArrowRight className="w-4 h-4 mr-2" />
                🔄 {t("nextOperation")}
              </h3>

              <div className="text-sm space-y-2">
                <div>
                  <span className="text-blue-700">{t("operation")}:</span>
                  <span className="ml-2 font-medium">
                    {t(currentWork.nextOperation)} ({t(currentWork.nextMachine)}
                    )
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">{t("sendToNext")}:</span>
                  <span className="ml-2 font-medium">
                    {currentLanguage === "np"
                      ? `${t(currentWork.nextMachine)} स्टेसन`
                      : `${t(currentWork.nextMachine)} Station`}
                  </span>
                </div>
                {currentWork.nextOperator && (
                  <div>
                    <span className="text-blue-700">{t("nextOperator")}:</span>
                    <span className="ml-2 font-medium">
                      {currentWork.nextOperator}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">
              📊 {t("summary")}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-white rounded">
                <div className="font-bold text-lg text-blue-600">
                  {formatNumber(formData.completedPieces)}
                </div>
                <div className="text-gray-600">{t("completed")}</div>
              </div>
              <div className="text-center p-2 bg-white rounded">
                <div className="font-bold text-lg text-red-600">
                  {formatNumber(formData.defectivePieces)}
                </div>
                <div className="text-gray-600">{t("defective")}</div>
              </div>
              <div className="text-center p-2 bg-white rounded">
                <div className="font-bold text-lg text-green-600">
                  {formatNumber(getQualityPercentage())}%
                </div>
                <div className="text-gray-600">{t("quality")}</div>
              </div>
              <div className="text-center p-2 bg-white rounded">
                <div className="font-bold text-lg text-purple-600">
                  {formatNumber(formData.actualTimeSpent)}
                </div>
                <div className="text-gray-600">{t("minutes")}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || formData.completedPieces === 0}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t("processing")}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t("sendToNext")}
                </>
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 text-center">
            {currentLanguage === "np"
              ? "काम पूरा गरेपछि यो अर्को चरणमा स्वचालित रूपमा पठाइनेछ"
              : "Work will be automatically sent to next stage after completion"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkCompletion;

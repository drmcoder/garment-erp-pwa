import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../hooks/useNotifications";

const QualityReport = ({ bundleData, onSubmit, onCancel }) => {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const { showQualityNotification } = useNotifications();

  const [reportData, setReportData] = useState({
    defectType: "",
    customDefectType: "",
    severity: "minor",
    affectedPieces: 1,
    totalPieces: bundleData?.totalPieces || 30,
    description: "",
    cause: "",
    preventiveMeasure: "",
    images: [],
    requiresRework: false,
    canContinue: true,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Defect categories with Nepali translations
  const defectCategories = {
    fabric: {
      label: currentLanguage === "np" ? "कपडाको दोष" : "Fabric Defects",
      options: [
        {
          id: "fabric-hole",
          np: "कपडामा प्वाल",
          en: "Fabric Hole",
          severity: "major",
        },
        {
          id: "fabric-stain",
          np: "कपडाको दाग",
          en: "Fabric Stain",
          severity: "minor",
        },
        {
          id: "fabric-tear",
          np: "कपडा च्यातिएको",
          en: "Fabric Tear",
          severity: "major",
        },
        {
          id: "wrong-fabric",
          np: "गलत कपडा",
          en: "Wrong Fabric",
          severity: "major",
        },
        {
          id: "fabric-defect",
          np: "कपडाको गुणस्तर",
          en: "Fabric Quality",
          severity: "minor",
        },
      ],
    },
    stitching: {
      label: currentLanguage === "np" ? "सिलाईको समस्या" : "Stitching Problems",
      options: [
        {
          id: "broken-stitch",
          np: "बिग्रिएको सिलाई",
          en: "Broken Stitch",
          severity: "minor",
        },
        {
          id: "loose-stitch",
          np: "ढीलो सिलाई",
          en: "Loose Stitch",
          severity: "minor",
        },
        {
          id: "wrong-stitch",
          np: "गलत सिलाई",
          en: "Wrong Stitch Type",
          severity: "major",
        },
        {
          id: "uneven-stitch",
          np: "असमान सिलाई",
          en: "Uneven Stitching",
          severity: "minor",
        },
        {
          id: "skipped-stitch",
          np: "छुटेको सिलाई",
          en: "Skipped Stitch",
          severity: "minor",
        },
      ],
    },
    machine: {
      label: currentLanguage === "np" ? "मेसिन सम्बन्धी" : "Machine Related",
      options: [
        {
          id: "oil-stain",
          np: "तेलको दाग",
          en: "Oil Stain",
          severity: "major",
        },
        {
          id: "needle-mark",
          np: "सुईको निशान",
          en: "Needle Mark",
          severity: "minor",
        },
        {
          id: "machine-mark",
          np: "मेसिनको निशान",
          en: "Machine Mark",
          severity: "minor",
        },
        {
          id: "burn-mark",
          np: "जलेको निशान",
          en: "Burn Mark",
          severity: "major",
        },
      ],
    },
    measurement: {
      label:
        currentLanguage === "np"
          ? "साइज/नापको समस्या"
          : "Size/Measurement Issues",
      options: [
        {
          id: "wrong-size",
          np: "गलत साइज",
          en: "Wrong Size",
          severity: "major",
        },
        {
          id: "wrong-color",
          np: "गलत रङ",
          en: "Wrong Color",
          severity: "major",
        },
        {
          id: "measurement-error",
          np: "नापको त्रुटि",
          en: "Measurement Error",
          severity: "major",
        },
        {
          id: "mixed-bundle",
          np: "मिक्स बन्डल",
          en: "Mixed Bundle",
          severity: "major",
        },
      ],
    },
  };

  const causes = [
    { id: "operator-error", np: "मेरो गल्ती (ऑपरेटर)", en: "Operator Error" },
    { id: "machine-issue", np: "मेसिनको समस्या", en: "Machine Issue" },
    { id: "fabric-quality", np: "कपडाको गुणस्तर", en: "Fabric Quality" },
    {
      id: "previous-operation",
      np: "अघिल्लो कामको समस्या",
      en: "Previous Operation Issue",
    },
    { id: "material-shortage", np: "सामग्रीको अभाव", en: "Material Shortage" },
    {
      id: "unclear-instruction",
      np: "स्पष्ट निर्देशन नभएको",
      en: "Unclear Instructions",
    },
    { id: "unknown", np: "थाहा छैन", en: "Unknown" },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReportData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseInt(value) || 0
          : value,
    }));

    // Auto-set severity based on defect type
    if (name === "defectType") {
      const allDefects = Object.values(defectCategories).flatMap(
        (cat) => cat.options
      );
      const selectedDefect = allDefects.find((defect) => defect.id === value);
      if (selectedDefect) {
        setReportData((prev) => ({
          ...prev,
          severity: selectedDefect.severity,
        }));
      }
    }

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

    if (!reportData.defectType && !reportData.customDefectType) {
      errors.defectType =
        currentLanguage === "np"
          ? "समस्याको प्रकार छान्नु आवश्यक छ"
          : "Defect type is required";
    }

    if (reportData.affectedPieces <= 0) {
      errors.affectedPieces =
        currentLanguage === "np"
          ? "प्रभावित टुक्रा संख्या १ वा बढी हुनुपर्छ"
          : "Affected pieces must be 1 or more";
    }

    if (reportData.affectedPieces > reportData.totalPieces) {
      errors.affectedPieces =
        currentLanguage === "np"
          ? "प्रभावित टुक्रा कुल टुक्रा भन्दा बढी हुन सक्दैन"
          : "Affected pieces cannot exceed total pieces";
    }

    if (!reportData.description.trim()) {
      errors.description =
        currentLanguage === "np"
          ? "समस्याको विवरण आवश्यक छ"
          : "Problem description is required";
    }

    if (!reportData.cause) {
      errors.cause =
        currentLanguage === "np"
          ? "समस्याको कारण छान्नु आवश्यक छ"
          : "Problem cause is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const qualityIssue = {
        ...reportData,
        bundleId: bundleData.id,
        bundleNumber: bundleData.bundleNumber,
        operatorId: user.id,
        operatorName: user.name,
        operation: bundleData.operation,
        machine: bundleData.machine,
        reportedAt: new Date().toISOString(),
        status: "open",
        defectTypeName: reportData.defectType
          ? Object.values(defectCategories)
              .flatMap((cat) => cat.options)
              .find((opt) => opt.id === reportData.defectType)?.[
              currentLanguage === "np" ? "np" : "en"
            ]
          : reportData.customDefectType,
        causeName: causes.find((c) => c.id === reportData.cause)?.[
          currentLanguage === "np" ? "np" : "en"
        ],
      };

      // Show notification to supervisor
      await showQualityNotification({
        bundleId: bundleData.bundleNumber,
        defectType: qualityIssue.defectTypeName,
        severity: reportData.severity,
      });

      onSubmit(qualityIssue);
    } catch (error) {
      console.error("Error submitting quality report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAllDefectOptions = () => {
    return Object.values(defectCategories).flatMap((category) =>
      category.options.map((option) => ({
        ...option,
        category: category.label,
      }))
    );
  };

  const defectPercentage = Math.round(
    (reportData.affectedPieces / reportData.totalPieces) * 100
  );

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
                  ? "गुणस्तर समस्या रिपोर्ट"
                  : "Quality Issue Report"}
              </h1>
              <p className="text-sm text-gray-600">
                {bundleData.article}# {bundleData.articleName}
              </p>
            </div>
          </div>

          {/* Bundle Info */}
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-800">
                  {currentLanguage === "np"
                    ? "समस्या रिपोर्ट गर्दै"
                    : "Reporting Issue"}
                </h3>
                <p className="text-sm text-red-700">
                  बन्डल: {bundleData.bundleNumber} | {bundleData.operation}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Defect Type Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {currentLanguage === "np" ? "समस्याको प्रकार" : "Problem Type"}
            </h2>

            <div className="space-y-4">
              {Object.entries(defectCategories).map(
                ([categoryKey, category]) => (
                  <div key={categoryKey}>
                    <h3 className="font-medium text-gray-700 mb-2">
                      {category.label}
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {category.options.map((option) => (
                        <label
                          key={option.id}
                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="defectType"
                            value={option.id}
                            checked={reportData.defectType === option.id}
                            onChange={handleInputChange}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <span className="font-medium">
                              {currentLanguage === "np" ? option.np : option.en}
                            </span>
                            <span
                              className={`ml-2 text-xs px-2 py-1 rounded ${
                                option.severity === "major"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {option.severity === "major"
                                ? currentLanguage === "np"
                                  ? "गम्भीर"
                                  : "Major"
                                : currentLanguage === "np"
                                ? "सामान्य"
                                : "Minor"}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* Custom Defect Type */}
              <div>
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="defectType"
                    value="custom"
                    checked={reportData.defectType === "custom"}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <span className="font-medium">
                    {currentLanguage === "np" ? "अन्य समस्या" : "Other Problem"}
                  </span>
                </label>

                {reportData.defectType === "custom" && (
                  <div className="mt-2">
                    <input
                      type="text"
                      name="customDefectType"
                      value={reportData.customDefectType}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={
                        currentLanguage === "np"
                          ? "समस्याको प्रकार लेख्नुहोस्..."
                          : "Describe the problem type..."
                      }
                    />
                  </div>
                )}
              </div>

              {validationErrors.defectType && (
                <p className="text-red-600 text-sm">
                  {validationErrors.defectType}
                </p>
              )}
            </div>
          </div>

          {/* Affected Pieces */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {currentLanguage === "np"
                ? "प्रभावित टुक्राहरू"
                : "Affected Pieces"}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLanguage === "np"
                    ? "कुल टुक्रा संख्या"
                    : "Total Pieces"}
                </label>
                <input
                  type="number"
                  value={reportData.totalPieces}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLanguage === "np"
                    ? "समस्या भएको टुक्रा"
                    : "Problematic Pieces"}{" "}
                  *
                </label>
                <input
                  type="number"
                  name="affectedPieces"
                  value={reportData.affectedPieces}
                  onChange={handleInputChange}
                  min="1"
                  max={reportData.totalPieces}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.affectedPieces
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  required
                />
                {validationErrors.affectedPieces && (
                  <p className="text-red-600 text-sm mt-1">
                    {validationErrors.affectedPieces}
                  </p>
                )}
              </div>
            </div>

            {defectPercentage > 0 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-orange-700">
                    {currentLanguage === "np" ? "दोष दर" : "Defect Rate"}:
                  </span>
                  <span className="font-bold text-orange-800">
                    {defectPercentage}%
                  </span>
                </div>
                <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${Math.min(defectPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Problem Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {currentLanguage === "np"
                ? "समस्याको विवरण"
                : "Problem Description"}
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === "np"
                  ? "विस्तृत विवरण"
                  : "Detailed Description"}{" "}
                *
              </label>
              <textarea
                name="description"
                value={reportData.description}
                onChange={handleInputChange}
                rows="4"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.description
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder={
                  currentLanguage === "np"
                    ? "समस्याको विस्तृत विवरण लेख्नुहोस्... (कहाँ, कसरी, कति भएको आदि)"
                    : "Describe the problem in detail... (where, how, extent, etc.)"
                }
                required
              />
              {validationErrors.description && (
                <p className="text-red-600 text-sm mt-1">
                  {validationErrors.description}
                </p>
              )}
            </div>
          </div>

          {/* Problem Cause */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {currentLanguage === "np" ? "समस्याको कारण" : "Problem Cause"}
            </h2>

            <div className="space-y-2">
              {causes.map((cause) => (
                <label
                  key={cause.id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="cause"
                    value={cause.id}
                    checked={reportData.cause === cause.id}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <span className="font-medium">
                    {currentLanguage === "np" ? cause.np : cause.en}
                  </span>
                </label>
              ))}

              {validationErrors.cause && (
                <p className="text-red-600 text-sm">{validationErrors.cause}</p>
              )}
            </div>
          </div>

          {/* Additional Options */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {currentLanguage === "np"
                ? "अतिरिक्त जानकारी"
                : "Additional Information"}
            </h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="requiresRework"
                  checked={reportData.requiresRework}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                <label className="text-sm text-gray-700">
                  {currentLanguage === "np"
                    ? "पुनः काम आवश्यक छ"
                    : "Rework Required"}
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="canContinue"
                  checked={reportData.canContinue}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                <label className="text-sm text-gray-700">
                  {currentLanguage === "np"
                    ? "बाँकी काम जारी राख्न सकिन्छ"
                    : "Can continue with remaining work"}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLanguage === "np"
                    ? "रोकथामका उपायहरू"
                    : "Preventive Measures"}
                </label>
                <textarea
                  name="preventiveMeasure"
                  value={reportData.preventiveMeasure}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    currentLanguage === "np"
                      ? "भविष्यमा यो समस्या नहोस् भनेर के गर्न सकिन्छ?"
                      : "What can be done to prevent this issue in future?"
                  }
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {currentLanguage === "np" ? "रद्द गर्नुहोस्" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {currentLanguage === "np" ? "पठाउँदै..." : "Submitting..."}
                </>
              ) : currentLanguage === "np" ? (
                "रिपोर्ट पठाउनुहोस्"
              ) : (
                "Submit Report"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QualityReport;

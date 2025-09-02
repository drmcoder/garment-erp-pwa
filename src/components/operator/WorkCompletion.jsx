// src/components/operator/WorkCompletion.jsx
// Complete work completion flow with piece counting and handoffs

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { LanguageContext } from "../../contexts/LanguageContext";
import { NotificationContext } from "../../contexts/NotificationContext";
import { damageReportService } from "../../services/DamageReportService";
import { operatorWalletService } from "../../services/OperatorWalletService";

const WorkCompletion = ({ bundleId, onWorkCompleted, onCancel }) => {
  const { user } = useContext(AuthContext);
  const { t, isNepali, formatNumber, formatCurrency } =
    useContext(LanguageContext);
  const { showNotification, sendWorkCompleted, sendWorkflowNotification, sendMachineGroupNotification } =
    useContext(NotificationContext);

  const [bundleData, setBundleData] = useState(null);
  const [completionData, setCompletionData] = useState({
    piecesCompleted: 0,
    defectivePieces: 0,
    qualityScore: 100,
    timeSpent: 0,
    startTime: "",
    endTime: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Input, 2: Review, 3: Handoff

  useEffect(() => {
    if (bundleId) {
      loadBundleData();
    }
  }, [bundleId]);

  const loadBundleData = async () => {
    setLoading(true);
    try {
      // Simulate API call to get bundle data
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock bundle data - in real app, fetch from API
      const mockBundle = {
        id: bundleId,
        articleNumber: "8085",
        articleName: isNepali ? "नीलो टी-शर्ट" : "Blue T-Shirt",
        color: "नीलो-१",
        size: "XL",
        pieces: 30,
        operation: isNepali ? "काँध जोड्ने" : "Shoulder Join",
        machineType: isNepali ? "ओभरलक" : "Overlock",
        rate: 2.5,
        assignedAt: new Date(Date.now() - 3600000).toISOString(),
        priority: isNepali ? "सामान्य" : "Normal",
        nextOperation: isNepali ? "साइड सिम" : "Side Seam",
        nextMachine: isNepali ? "ओभरलक" : "Overlock",
        nextOperator: isNepali ? "सीता देवी" : "Sita Devi",
      };

      setBundleData(mockBundle);

      // Set initial completion data
      setCompletionData((prev) => ({
        ...prev,
        piecesCompleted: mockBundle.pieces,
        startTime: new Date().toTimeString().slice(0, 5),
      }));
    } catch (error) {
      showNotification(
        isNepali
          ? "बन्डल डेटा लोड गर्न समस्या भयो"
          : "Failed to load bundle data",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCompletionData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-calculate quality score based on defects
    if (field === "defectivePieces" || field === "piecesCompleted") {
      const pieces =
        field === "piecesCompleted" ? value : completionData.piecesCompleted;
      const defects =
        field === "defectivePieces" ? value : completionData.defectivePieces;

      if (pieces > 0) {
        const qualityScore = Math.max(
          0,
          Math.round(((pieces - defects) / pieces) * 100)
        );
        setCompletionData((prev) => ({ ...prev, qualityScore }));
      }
    }

    // Auto-calculate time spent
    if (field === "endTime" && completionData.startTime) {
      const start = new Date(`2000-01-01T${completionData.startTime}:00`);
      const end = new Date(`2000-01-01T${value}:00`);
      const timeSpent = Math.round((end - start) / (1000 * 60)); // minutes

      if (timeSpent > 0) {
        setCompletionData((prev) => ({ ...prev, timeSpent }));
      }
    }
  };

  const validateCompletion = () => {
    const errors = [];

    if (completionData.piecesCompleted <= 0) {
      errors.push(
        isNepali
          ? "पूरा भएको टुक्राको संख्या आवश्यक छ"
          : "Completed pieces required"
      );
    }

    if (completionData.piecesCompleted > bundleData.pieces) {
      errors.push(
        isNepali
          ? "पूरा भएको टुक्रा तोकिएको भन्दा बढी हुन सक्दैन"
          : "Completed pieces cannot exceed assigned pieces"
      );
    }

    if (completionData.defectivePieces < 0) {
      errors.push(
        isNepali
          ? "दोषयुक्त टुक्रा ० भन्दा कम हुन सक्दैन"
          : "Defective pieces cannot be negative"
      );
    }

    if (completionData.defectivePieces > completionData.piecesCompleted) {
      errors.push(
        isNepali
          ? "दोषयुक्त टुक्रा पूरा भएको भन्दा बढी हुन सक्दैन"
          : "Defective pieces cannot exceed completed pieces"
      );
    }

    if (!completionData.endTime) {
      errors.push(isNepali ? "समाप्ति समय आवश्यक छ" : "End time required");
    }

    return errors;
  };

  const handleNext = () => {
    const errors = validateCompletion();
    if (errors.length > 0) {
      errors.forEach((error) => showNotification(error, "error"));
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // CRITICAL: Check if bundle has pending damage reports that block payment
      const damageCheckResult = await checkBundleDamageStatus(bundleData.id);
      
      if (damageCheckResult.hasUnresolvedDamage) {
        showNotification(
          isNepali 
            ? `⚠️ भुक्तानी रोकिएको छ! ${damageCheckResult.pendingPieces} टुक्रा रिवर्क मा छ। पहिले क्षतिग्रस्त टुक्रा पूरा गर्नुहोस्।`
            : `⚠️ Payment held! ${damageCheckResult.pendingPieces} pieces in rework. Complete damaged pieces first.`,
          "error"
        );
        
        // Show detailed damage info
        console.log("🔒 PAYMENT BLOCKED - Unresolved damage reports:", damageCheckResult.damageReports);
        setLoading(false);
        return;
      }

      const validPieces =
        completionData.piecesCompleted - completionData.defectivePieces;
      
      // Check if operator is trying to complete work without finishing all assigned pieces
      const totalAssignedPieces = bundleData.pieces;
      const remainingPieces = totalAssignedPieces - validPieces - completionData.defectivePieces;
      
      if (remainingPieces > 0 && !damageCheckResult.hasPendingRework) {
        showNotification(
          isNepali
            ? `⚠️ ${remainingPieces} टुक्रा बाँकी छ। सबै टुक्रा पूरा गर्नुहोस्।`
            : `⚠️ ${remainingPieces} pieces remaining. Complete all pieces.`,
          "error"
        );
        setLoading(false);
        return;
      }

      const earnings = validPieces * bundleData.rate;

      // Enhanced API call with damage report awareness
      const response = await fetch("/api/bundles/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // No localStorage token - would need proper auth
        },
        body: JSON.stringify({
          bundleId: bundleData.id,
          ...completionData,
          validPieces,
          earnings,
          damageStatus: damageCheckResult.status,
          totalAssignedPieces: totalAssignedPieces,
          hasCompletedAllWork: remainingPieces === 0
        }),
      });

      if (response.ok) {
        // Send completion notification
        sendWorkCompleted(bundleData.articleNumber, bundleData.operation, validPieces, earnings);

        // Send workflow notifications to next operators
        if (bundleData.nextOperation && bundleData.nextMachine) {
          const completedWorkData = {
            operatorName: user.name,
            operation: bundleData.operation,
            articleNumber: bundleData.articleNumber,
            pieces: validPieces
          };

          // Determine next operators based on machine type
          const nextOperators = [{
            operation: bundleData.nextOperation,
            machineType: bundleData.nextMachine
          }];

          sendWorkflowNotification(completedWorkData, nextOperators);

          // Also send machine group notification
          sendMachineGroupNotification(bundleData.nextMachine, {
            articleNumber: bundleData.articleNumber,
            nextOperation: bundleData.nextOperation,
            pieces: validPieces
          });
        }

        showNotification(
          isNepali
            ? `काम सम्पन्न! कमाई: ${formatCurrency(earnings)}`
            : `Work completed! Earnings: ${formatCurrency(earnings)}`,
          "success"
        );

        // Proceed to handoff step
        setStep(3);
      } else {
        throw new Error("Failed to complete work");
      }
    } catch (error) {
      showNotification(
        isNepali ? "काम सम्पन्न गर्न समस्या भयो" : "Failed to complete work",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleHandoff = async () => {
    setLoading(true);
    try {
      // Simulate handoff to next operator
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showNotification(
        isNepali
          ? `बन्डल ${bundleData.nextOperator} लाई पठाइयो`
          : `Bundle sent to ${bundleData.nextOperator}`,
        "success"
      );

      // Call parent completion handler
      if (onWorkCompleted) {
        onWorkCompleted({
          bundleId: bundleData.id,
          earnings:
            (completionData.piecesCompleted - completionData.defectivePieces) *
            bundleData.rate,
          completionData,
        });
      }
    } catch (error) {
      showNotification(
        isNepali ? "हस्तान्तरण गर्न समस्या भयो" : "Failed to handoff work",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = () => {
    const validPieces =
      completionData.piecesCompleted - completionData.defectivePieces;
    return validPieces * (bundleData?.rate || 0);
  };

  const calculateEfficiency = () => {
    if (!completionData.timeSpent || !completionData.piecesCompleted) return 0;
    const expectedTime = completionData.piecesCompleted * 1.2; // 1.2 minutes per piece
    return Math.round((expectedTime / completionData.timeSpent) * 100);
  };

  /**
   * Check if bundle has unresolved damage reports that would block payment
   */
  const checkBundleDamageStatus = async (bundleId) => {
    try {
      // Get pending damage reports for this bundle
      const damageReports = await damageReportService.getDamageReports({
        bundleId: bundleId,
        operatorId: user.id,
        status: ['reported_to_supervisor', 'acknowledged', 'in_supervisor_queue', 'rework_in_progress', 'returned_to_operator']
      });

      if (!damageReports.success) {
        console.warn('Could not check damage status:', damageReports.error);
        return { 
          hasUnresolvedDamage: false, 
          status: 'unknown',
          pendingPieces: 0,
          damageReports: []
        };
      }

      const pendingReports = damageReports.data || [];
      const hasUnresolvedDamage = pendingReports.length > 0;
      
      // Count total pending pieces in damage reports
      const pendingPieces = pendingReports.reduce((total, report) => {
        return total + (report.pieceCount || report.pieceNumbers?.length || 0);
      }, 0);

      // Check if there are pieces returned to operator that need completion
      const hasPendingRework = pendingReports.some(report => 
        report.status === 'returned_to_operator'
      );

      return {
        hasUnresolvedDamage,
        status: hasUnresolvedDamage ? 'damage_pending' : 'clean',
        pendingPieces,
        hasPendingRework,
        damageReports: pendingReports
      };
    } catch (error) {
      console.error('Error checking bundle damage status:', error);
      return { 
        hasUnresolvedDamage: false, 
        status: 'error',
        pendingPieces: 0,
        damageReports: []
      };
    }
  };

  if (loading && !bundleData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <span>{isNepali ? "लोड गर्दै..." : "Loading..."}</span>
      </div>
    );
  }

  if (!bundleData) {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isNepali ? "बन्डल फेला परेन" : "Bundle not found"}
        </h3>
        <button
          onClick={onCancel}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          {isNepali ? "पछाडि जानुहोस्" : "Go Back"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNepali ? "काम पूरा गर्नुहोस्" : "Complete Work"}
            </h1>
            <p className="text-gray-600 mt-1">
              {bundleData.articleName} - {bundleData.operation}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                step === 1
                  ? "bg-blue-100 text-blue-800"
                  : step === 2
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {step === 1
                ? isNepali
                  ? "डेटा इनपुट"
                  : "Input Data"
                : step === 2
                ? isNepali
                  ? "समीक्षा"
                  : "Review"
                : isNepali
                ? "हस्तान्तरण"
                : "Handoff"}
            </span>
          </div>
        </div>
      </div>

      {/* Bundle Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">
          {isNepali ? "बन्डल जानकारी" : "Bundle Information"}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-gray-500 text-sm">
              {isNepali ? "लेख:" : "Article:"}
            </span>
            <div className="font-medium">#{bundleData.articleNumber}</div>
          </div>
          <div>
            <span className="text-gray-500 text-sm">
              {isNepali ? "रङ/साइज:" : "Color/Size:"}
            </span>
            <div className="font-medium">
              {bundleData.color} / {bundleData.size}
            </div>
          </div>
          <div>
            <span className="text-gray-500 text-sm">
              {isNepali ? "तोकिएको:" : "Assigned:"}
            </span>
            <div className="font-medium">
              {formatNumber(bundleData.pieces)} {isNepali ? "टुक्रा" : "pieces"}
            </div>
          </div>
          <div>
            <span className="text-gray-500 text-sm">
              {isNepali ? "दर:" : "Rate:"}
            </span>
            <div className="font-medium">
              {formatCurrency(bundleData.rate)}/{isNepali ? "टुक्रा" : "pc"}
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Input Data */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {isNepali ? "काम पूरा गर्नुहोस्" : "Complete Work Details"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isNepali ? "पूरा भएको टुक्रा:" : "Completed Pieces:"}
                </label>
                <input
                  type="number"
                  min="0"
                  max={bundleData.pieces}
                  value={completionData.piecesCompleted}
                  onChange={(e) =>
                    handleInputChange(
                      "piecesCompleted",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isNepali ? "दोषयुक्त टुक्रा:" : "Defective Pieces:"}
                </label>
                <input
                  type="number"
                  min="0"
                  max={completionData.piecesCompleted}
                  value={completionData.defectivePieces}
                  onChange={(e) =>
                    handleInputChange(
                      "defectivePieces",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isNepali ? "गुणस्तर स्कोर:" : "Quality Score:"}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={completionData.qualityScore}
                    onChange={(e) =>
                      handleInputChange(
                        "qualityScore",
                        parseInt(e.target.value)
                      )
                    }
                    className="flex-1"
                  />
                  <span className="text-lg font-semibold w-12">
                    {completionData.qualityScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isNepali ? "सुरु समय:" : "Start Time:"}
                </label>
                <input
                  type="time"
                  value={completionData.startTime}
                  onChange={(e) =>
                    handleInputChange("startTime", e.target.value)
                  }
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isNepali ? "समाप्ति समय:" : "End Time:"}
                </label>
                <input
                  type="time"
                  value={completionData.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isNepali ? "टिप्पणी:" : "Notes:"}
                </label>
                <textarea
                  value={completionData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows="3"
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder={isNepali ? "कुनै टिप्पणी..." : "Any notes..."}
                />
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 text-sm">
                {isNepali ? "राम्रो टुक्रा:" : "Good Pieces:"}
              </div>
              <div className="text-green-800 text-xl font-bold">
                {formatNumber(
                  completionData.piecesCompleted -
                    completionData.defectivePieces
                )}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-600 text-sm">
                {isNepali ? "कमाई:" : "Earnings:"}
              </div>
              <div className="text-blue-800 text-xl font-bold">
                {formatCurrency(calculateEarnings())}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-purple-600 text-sm">
                {isNepali ? "समय:" : "Time:"}
              </div>
              <div className="text-purple-800 text-xl font-bold">
                {completionData.timeSpent} {isNepali ? "मिनेट" : "min"}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-orange-600 text-sm">
                {isNepali ? "दक्षता:" : "Efficiency:"}
              </div>
              <div className="text-orange-800 text-xl font-bold">
                {calculateEfficiency()}%
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              {isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isNepali ? "अर्को चरण" : "Next Step"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {isNepali ? "समीक्षा र पुष्टि" : "Review & Confirm"}
          </h3>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="font-medium mb-4">
              {isNepali ? "काम सारांश:" : "Work Summary:"}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">
                  {isNepali ? "पूरा भएको टुक्रा:" : "Completed Pieces:"}
                </span>
                <span className="float-right font-medium">
                  {formatNumber(completionData.piecesCompleted)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">
                  {isNepali ? "दोषयुक्त टुक्रा:" : "Defective Pieces:"}
                </span>
                <span className="float-right font-medium">
                  {formatNumber(completionData.defectivePieces)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">
                  {isNepali ? "राम्रो टुक्रा:" : "Good Pieces:"}
                </span>
                <span className="float-right font-medium text-green-600">
                  {formatNumber(
                    completionData.piecesCompleted -
                      completionData.defectivePieces
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-600">
                  {isNepali ? "गुणस्तर स्कोर:" : "Quality Score:"}
                </span>
                <span className="float-right font-medium">
                  {completionData.qualityScore}%
                </span>
              </div>
              <div>
                <span className="text-gray-600">
                  {isNepali ? "समय लाग्यो:" : "Time Spent:"}
                </span>
                <span className="float-right font-medium">
                  {completionData.timeSpent} {isNepali ? "मिनेट" : "min"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">
                  {isNepali ? "दक्षता:" : "Efficiency:"}
                </span>
                <span className="float-right font-medium">
                  {calculateEfficiency()}%
                </span>
              </div>
              <div className="col-span-2 border-t pt-2">
                <span className="text-gray-600 text-lg">
                  {isNepali ? "कुल कमाई:" : "Total Earnings:"}
                </span>
                <span className="float-right font-bold text-lg text-green-600">
                  {formatCurrency(calculateEarnings())}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              {isNepali ? "फेरि सम्पादन गर्नुहोस्" : "Edit Again"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isNepali ? "सुरक्षित गर्दै..." : "Saving..."}
                </div>
              ) : isNepali ? (
                "काम पूरा गर्नुहोस्"
              ) : (
                "Complete Work"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Handoff */}
      {step === 3 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-green-600 mb-2">
              {isNepali
                ? "काम सफलतापूर्वक सम्पन्न!"
                : "Work Successfully Completed!"}
            </h3>
            <p className="text-gray-600">
              {isNepali
                ? "अब अर्को ऑपरेटरलाई हस्तान्तरण गर्नुहोस्"
                : "Now handoff to next operator"}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h4 className="font-medium mb-4">
              {isNepali ? "अर्को चरण:" : "Next Step:"}
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600">
                  {isNepali ? "अर्को काम:" : "Next Operation:"}
                </span>
                <span className="float-right font-medium">
                  {bundleData.nextOperation}
                </span>
              </div>
              <div>
                <span className="text-gray-600">
                  {isNepali ? "मेसिन:" : "Machine:"}
                </span>
                <span className="float-right font-medium">
                  {bundleData.nextMachine}
                </span>
              </div>
              <div>
                <span className="text-gray-600">
                  {isNepali ? "ऑपरेटर:" : "Operator:"}
                </span>
                <span className="float-right font-medium">
                  {bundleData.nextOperator}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={handleHandoff}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isNepali ? "पठाउँदै..." : "Sending..."}
                </div>
              ) : isNepali ? (
                "🔄 अर्को ऑपरेटरलाई पठाउनुहोस्"
              ) : (
                "🔄 Send to Next Operator"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkCompletion;

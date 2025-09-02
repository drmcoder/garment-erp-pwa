// src/components/operator/DamageReportModal.jsx
// Modal for operators to report damaged pieces during work

import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationContext } from '../../context/NotificationContext';
import { DAMAGE_CATEGORIES, DAMAGE_URGENCY_LEVELS } from '../../config/damageTypesConfig';
import { damageReportService } from '../../services/DamageReportService';

const DamageReportModal = ({ 
  bundleData, 
  workItem,
  isOpen, 
  onClose, 
  onDamageReported,
  onSubmit
}) => {
  const { user } = useContext(AuthContext);
  const { isNepali } = useContext(LanguageContext);
  const { showNotification } = useContext(NotificationContext);

  const [reportData, setReportData] = useState({
    pieceNumbers: [],
    damageType: '',
    description: '',
    urgency: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get damage categories for operator (most common ones first)
  const getOperatorDamageCategories = () => {
    return [
      DAMAGE_CATEGORIES.FABRIC_DEFECTS,
      DAMAGE_CATEGORIES.CUTTING_ISSUES, 
      DAMAGE_CATEGORIES.COLOR_ISSUES,
      DAMAGE_CATEGORIES.MACHINE_RELATED,
      DAMAGE_CATEGORIES.STITCHING_DEFECTS,
      DAMAGE_CATEGORIES.HANDLING_DAMAGE
    ];
  };

  const [selectedCategory, setSelectedCategory] = useState(null);

  // Use workItem or bundleData for work information
  const currentWork = workItem || bundleData;
  const totalPieces = parseInt(currentWork?.pieces || currentWork?.quantity || 0);
  const workTitle = currentWork?.readableId || currentWork?.bundleNumber || currentWork?.displayName || 'Work Item';

  const handlePieceSelection = (pieceNum) => {
    const newSelection = reportData.pieceNumbers.includes(pieceNum)
      ? reportData.pieceNumbers.filter(p => p !== pieceNum)
      : [...reportData.pieceNumbers, pieceNum];
    
    // Max 3 pieces can be reported at once
    if (newSelection.length <= 3) {
      setReportData(prev => ({
        ...prev,
        pieceNumbers: newSelection
      }));
    } else {
      showNotification(
        isNepali ? 'एक पटकमा अधिकतम ३ टुक्रा मात्र रिपोर्ट गर्न सकिन्छ' : 'Maximum 3 pieces can be reported at once',
        'warning'
      );
    }
  };

  const handleSubmit = async () => {
    if (!reportData.damageType || reportData.pieceNumbers.length === 0) {
      showNotification(
        isNepali ? 'कृपया क्षतिको प्रकार र टुक्रा संख्या चयन गर्नुहोस्' : 'Please select damage type and piece numbers',
        'warning'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const damageReport = {
        bundleId: currentWork?.id,
        bundleNumber: workTitle,
        workItemId: currentWork?.id,
        operatorId: user.id,  // Fixed: changed from reportedBy to operatorId
        operatorName: user.name || user.nameEn,
        reportedAt: new Date().toISOString(),
        damageType: reportData.damageType,
        description: reportData.description,
        pieceNumbers: reportData.pieceNumbers,
        urgency: reportData.urgency,
        status: 'reported_to_supervisor',
        supervisorId: currentWork?.assignedBy || 'sup001', // Default to supervisor
        article: currentWork?.article || currentWork?.articleNumber,
        operation: currentWork?.currentOperation || currentWork?.operation,
        pieces: totalPieces,
        rate: currentWork?.rate || 0,
        reworkDetails: {
          startTime: null,
          completedTime: null,
          partsReplaced: [],
          supervisorNotes: '',
          timeSpent: 0
        }
      };

      // Save damage report to database
      const saveResult = await damageReportService.submitDamageReport(damageReport);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save damage report');
      }

      // Send notification to supervisor (simplified approach)
      console.log('📧 Damage report notification sent to supervisor:', {
        supervisorId: damageReport.supervisorId,
        operatorName: user.name || user.nameEn,
        bundleNumber: workTitle,
        damageType: reportData.damageType,
        pieceCount: reportData.pieceNumbers.length,
        urgency: reportData.urgency
      });

      // Update parent component - call the appropriate callback
      if (onSubmit) {
        onSubmit(damageReport);
      } else if (onDamageReported) {
        onDamageReported(damageReport);
      }

      showNotification(
        isNepali 
          ? `${reportData.pieceNumbers.length} टुक्रा क्षतिको रिपोर्ट सुपरवाइजरलाई पठाइयो`
          : `${reportData.pieceNumbers.length} pieces reported for damage to supervisor`,
        'success'
      );

      onClose();
    } catch (error) {
      console.error('Error reporting damage:', error);
      showNotification(
        isNepali ? 'रिपोर्ट गर्दा त्रुटि भयो' : 'Error reporting damage',
        'error'
      );
    }

    setIsSubmitting(false);
  };


  if (!isOpen) return null;

  const remainingPieces = totalPieces - (currentWork?.completedPieces || 0) - (currentWork?.damagedPieces || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {isNepali ? '🔧 क्षतिको रिपोर्ट' : '🔧 Report Damage'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>

          {/* Bundle Info */}
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <div className="text-sm font-medium text-blue-800">
              {workTitle} - {currentWork?.currentOperation || currentWork?.operation || 'N/A'}
            </div>
            <div className="text-xs text-blue-600">
              {isNepali ? 'बाँकी टुक्रा:' : 'Remaining pieces:'} {remainingPieces}
            </div>
          </div>

          {/* Piece Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isNepali ? 'क्षतिग्रस्त टुक्रा चयन गर्नुहोस् (अधिकतम ३):' : 'Select damaged pieces (max 3):'}
            </label>
            <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
              {Array.from({ length: remainingPieces }, (_, i) => {
                const pieceNum = (currentWork?.completedPieces || 0) + i + 1;
                const isSelected = reportData.pieceNumbers.includes(pieceNum);
                return (
                  <button
                    key={pieceNum}
                    onClick={() => handlePieceSelection(pieceNum)}
                    className={`px-2 py-1 text-xs rounded border ${
                      isSelected
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-red-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    #{pieceNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Damage Category Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isNepali ? 'क्षतिको श्रेणी चयन गर्नुहोस्:' : 'Select Damage Category:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {getOperatorDamageCategories().map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category);
                    setReportData(prev => ({ ...prev, damageType: '' }));
                  }}
                  className={`p-3 text-sm rounded border text-left ${
                    selectedCategory?.id === category.id
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }`}
                  disabled={isSubmitting}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{category.icon}</span>
                    <div>
                      <div className="font-medium text-xs">
                        {isNepali ? category.label.np : category.label.en}
                      </div>
                      <div className="text-xs opacity-75">
                        {category.types.length} types
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Specific Damage Type Selection */}
          {selectedCategory && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isNepali ? 'विशिष्ट क्षतिको प्रकार:' : 'Specific Damage Type:'}
              </label>
              <div className="space-y-2">
                {selectedCategory.types.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setReportData(prev => ({ ...prev, damageType: type.id }))}
                    className={`w-full p-3 text-sm rounded border text-left ${
                      reportData.damageType === type.id
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-red-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{type.icon}</span>
                      <div>
                        <div className="font-medium">
                          {isNepali ? type.np : type.en}
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          Severity: {type.severity} • 
                          {type.operatorFault 
                            ? (isNepali ? ' अपरेटरको जिम्मेवारी' : ' Operator responsibility')
                            : (isNepali ? ' अपरेटरको गल्ती होइन' : ' Not operator fault')
                          }
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isNepali ? 'विवरण (वैकल्पिक):' : 'Description (optional):'}
            </label>
            <textarea
              value={reportData.description}
              onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={isNepali ? 'क्षतिको बारेमा थप जानकारी...' : 'Additional details about damage...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows="2"
              disabled={isSubmitting}
            />
          </div>

          {/* Urgency */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isNepali ? 'प्राथमिकता:' : 'Priority Level:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(DAMAGE_URGENCY_LEVELS).map((urgencyLevel) => (
                <button
                  key={urgencyLevel.id}
                  onClick={() => setReportData(prev => ({ ...prev, urgency: urgencyLevel.id }))}
                  className={`py-2 px-3 text-sm rounded border text-left ${
                    reportData.urgency === urgencyLevel.id
                      ? `bg-${urgencyLevel.color}-500 text-white border-${urgencyLevel.color}-500`
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                  disabled={isSubmitting}
                >
                  <div className="flex items-center gap-2">
                    <span>{urgencyLevel.icon}</span>
                    <div>
                      <div className="font-medium text-xs">
                        {isNepali ? urgencyLevel.label.np : urgencyLevel.label.en}
                      </div>
                      <div className="text-xs opacity-75">
                        {urgencyLevel.maxResponseTime < 1 
                          ? `${urgencyLevel.maxResponseTime * 60} min`
                          : `${urgencyLevel.maxResponseTime} hr`
                        } response
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium"
              disabled={isSubmitting}
            >
              {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !reportData.damageType || reportData.pieceNumbers.length === 0}
              className="flex-1 py-2 px-4 bg-red-500 text-white hover:bg-red-600 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting 
                ? (isNepali ? '🔄 पठाउँदै...' : '🔄 Reporting...')
                : (isNepali ? '📤 सुपरवाइजरलाई पठाउनुहोस्' : '📤 Send to Supervisor')
              }
            </button>
          </div>

          {/* Info Message */}
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="text-xs text-green-700">
              💡 {isNepali 
                ? 'तपाईं बाँकी राम्रा टुक्राहरूमा काम जारी राख्न सक्नुहुन्छ। सुपरवाइजरले क्षतिग्रस्त टुक्रा ठीक गरेपछि फिर्ता दिनेछन्।'
                : 'You can continue working on remaining good pieces. Supervisor will return fixed pieces when ready.'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DamageReportModal;
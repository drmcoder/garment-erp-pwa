import React, { useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Send,
  Package,
  User,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import BundlePaymentHoldService from '../../services/BundlePaymentHoldService';

const EnhancedDamageReport = ({ bundleData, onReportSubmitted, onClose }) => {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const { showNotification } = useNotifications();
  const isNepali = currentLanguage === 'np';

  const [reportForm, setReportForm] = useState({
    damageCount: 1,
    damageType: 'fabric_hole',
    damageDescription: '',
    affectedPieces: 1,
    operatorFault: false,
    severity: 'minor',
    images: []
  });

  const [submitting, setSubmitting] = useState(false);

  const damageTypes = [
    { value: 'fabric_hole', label: isNepali ? 'कपडामा प्वाल' : 'Fabric Hole' },
    { value: 'broken_stitch', label: isNepali ? 'बिग्रिएको सिलाई' : 'Broken Stitch' },
    { value: 'wrong_measurement', label: isNepali ? 'गलत नाप' : 'Wrong Measurement' },
    { value: 'color_mismatch', label: isNepali ? 'रङ बेमेल' : 'Color Mismatch' },
    { value: 'missing_button', label: isNepali ? 'बटन छुटेको' : 'Missing Button' },
    { value: 'fabric_defect', label: isNepali ? 'कपडाको दोष' : 'Fabric Defect' },
    { value: 'cut_defect', label: isNepali ? 'काटेको दोष' : 'Cut Defect' },
    { value: 'other', label: isNepali ? 'अन्य' : 'Other' }
  ];

  const severityLevels = [
    { value: 'minor', label: isNepali ? 'सामान्य' : 'Minor', color: 'text-green-600' },
    { value: 'moderate', label: isNepali ? 'मध्यम' : 'Moderate', color: 'text-yellow-600' },
    { value: 'major', label: isNepali ? 'गम्भीर' : 'Major', color: 'text-red-600' }
  ];

  // Submit damage report with payment hold
  const submitDamageReport = async () => {
    if (!reportForm.damageDescription.trim()) {
      showNotification(
        isNepali ? 'कृपया क्षति विवरण लेख्नुहोस्' : 'Please describe the damage',
        'error'
      );
      return;
    }

    if (reportForm.damageCount > bundleData.pieces) {
      showNotification(
        isNepali ? 'क्षति संख्या बन्डल टुक्रा भन्दा बढी हुन सक्दैन' : 'Damage count cannot exceed bundle pieces',
        'error'
      );
      return;
    }

    setSubmitting(true);

    try {
      // Create bundle payment hold data
      const holdData = {
        bundleNumber: bundleData.bundleNumber,
        operatorId: user.uid,
        operatorName: user.name,
        totalPieces: bundleData.pieces,
        completedPieces: bundleData.pieces - reportForm.damageCount, // Assume rest was completed
        damageCount: reportForm.damageCount,
        damageType: reportForm.damageType,
        damageDescription: reportForm.damageDescription,
        affectedPieces: reportForm.affectedPieces,
        severity: reportForm.severity,
        operatorFault: reportForm.operatorFault,
        estimatedEarnings: bundleData.estimatedEarnings || 0,
        articleNumber: bundleData.articleNumber,
        operation: bundleData.operation,
        supervisorNotified: true
      };

      // Hold the bundle payment
      const holdResult = await BundlePaymentHoldService.holdBundlePayment(holdData);

      if (holdResult.success) {
        // Create damage notification for supervisor
        const damageNotification = {
          title: isNepali ? '⚠️ क्षति रिपोर्ट!' : '⚠️ Damage Report!',
          message: isNepali 
            ? `${user.name} ले ${bundleData.bundleNumber} मा ${reportForm.damageCount} टुक्रा क्षतिको रिपोर्ट गर्यो`
            : `${user.name} reported ${reportForm.damageCount} damaged pieces in ${bundleData.bundleNumber}`,
          type: 'damage_reported',
          priority: reportForm.severity === 'major' ? 'critical' : 'high',
          data: {
            bundleNumber: bundleData.bundleNumber,
            operatorName: user.name,
            operatorId: user.uid,
            damageCount: reportForm.damageCount,
            damageType: reportForm.damageType,
            severity: reportForm.severity,
            holdId: holdResult.holdId,
            urgency: reportForm.severity === 'major' ? 'urgent' : 'normal',
            actionType: 'DAMAGE_REPORTED',
            actionUrl: '#payment-holds' // Direct to payment holds tab
          }
        };

        // Send notification to supervisors (this would be handled by notification service)
        console.log('🚨 Damage notification:', damageNotification);

        showNotification(
          isNepali 
            ? 'क्षति रिपोर्ट सबमिट भयो - भुक्तानी होल्ड गरिएको छ'
            : 'Damage report submitted - Payment has been held',
          'success'
        );

        // Show important information to operator
        showNotification(
          isNepali 
            ? 'महत्वपूर्ण: यो बन्डलको भुक्तानी मर्मत सम्पन्न नभएसम्म होल्ड हुनेछ'
            : 'IMPORTANT: This bundle payment will be held until rework is completed',
          'warning'
        );

        if (onReportSubmitted) {
          onReportSubmitted(holdResult.data);
        }

        if (onClose) {
          onClose();
        }
      } else {
        throw new Error(holdResult.error);
      }

    } catch (error) {
      console.error('Error submitting damage report:', error);
      showNotification(
        isNepali ? 'क्षति रिपोर्ट सबमिट गर्न समस्या भयो' : 'Error submitting damage report',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-red-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-red-100 rounded-full p-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {isNepali ? 'क्षति रिपोर्ट गर्नुहोस्' : 'Report Damage'}
          </h3>
          <p className="text-sm text-gray-600">
            {bundleData.bundleNumber} • {bundleData.pieces} {isNepali ? 'टुक्रा' : 'pieces'}
          </p>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">
              {isNepali ? 'महत्वपूर्ण जानकारी:' : 'Important Information:'}
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              {isNepali 
                ? 'क्षति रिपोर्ट गरेपछि यो बन्डलको सम्पूर्ण भुक्तानी होल्ड हुनेछ। सुपरवाइजरले मर्मत असाइन गर्नेछ र मर्मत पूरा भएपछि मात्र भुक्तानी रिलिज हुनेछ।'
                : 'After reporting damage, the entire bundle payment will be held. Supervisor will assign rework and payment will be released only after rework completion.'
              }
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submitDamageReport(); }} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isNepali ? 'क्षतिको संख्या' : 'Number of Damaged Pieces'}
            </label>
            <input
              type="number"
              min="1"
              max={bundleData.pieces}
              value={reportForm.damageCount}
              onChange={(e) => setReportForm({...reportForm, damageCount: parseInt(e.target.value) || 1})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isNepali ? 'क्षतिको प्रकार' : 'Damage Type'}
            </label>
            <select
              value={reportForm.damageType}
              onChange={(e) => setReportForm({...reportForm, damageType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            >
              {damageTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isNepali ? 'गम्भीरता स्तर' : 'Severity Level'}
          </label>
          <div className="flex space-x-4">
            {severityLevels.map(level => (
              <label key={level.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="severity"
                  value={level.value}
                  checked={reportForm.severity === level.value}
                  onChange={(e) => setReportForm({...reportForm, severity: e.target.value})}
                  className="text-red-500 focus:ring-red-500"
                />
                <span className={`text-sm font-medium ${level.color}`}>
                  {level.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isNepali ? 'क्षति विवरण' : 'Damage Description'}
          </label>
          <textarea
            value={reportForm.damageDescription}
            onChange={(e) => setReportForm({...reportForm, damageDescription: e.target.value})}
            placeholder={isNepali 
              ? 'क्षति कहाँ र कसरी भएको हो विस्तारमा लेख्नुहोस्...'
              : 'Describe where and how the damage occurred in detail...'
            }
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            required
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={reportForm.operatorFault}
              onChange={(e) => setReportForm({...reportForm, operatorFault: e.target.checked})}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">
              {isNepali 
                ? 'यो मेरो गल्ती हो (यो चेक गरेमा भुक्तानीबाट कटौती हुन सक्छ)'
                : 'This was my fault (checking this may result in payment deduction)'
              }
            </span>
          </label>
        </div>

        <div className="flex space-x-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{isNepali ? 'क्षति रिपोर्ट सबमिट गर्नुहोस्' : 'Submit Damage Report'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Additional Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">
          {isNepali ? 'यसपछि के हुन्छ?' : 'What happens next?'}
        </h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>{isNepali ? 'सुपरवाइजरलाई तुरुन्त सूचना पठाइनेछ' : 'Supervisor will be notified immediately'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-yellow-500" />
            <span>{isNepali ? 'बन्डल भुक्तानी होल्ड हुनेछ' : 'Bundle payment will be held'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-green-500" />
            <span>{isNepali ? 'मर्मत काम असाइन गरिनेछ' : 'Rework will be assigned'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>{isNepali ? 'मर्मत पूरा भएपछि भुक्तानी रिलिज हुनेछ' : 'Payment released after rework completion'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDamageReport;
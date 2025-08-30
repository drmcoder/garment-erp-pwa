import React, { useState, useEffect } from 'react';
import { MapPin, Shield, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { locationService } from '../../services/LocationService';

const LocationGuard = ({ children, requireLocation = true }) => {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const isNepali = currentLanguage === 'np';

  const [locationStatus, setLocationStatus] = useState('checking'); // checking, granted, denied, pending, error
  const [locationData, setLocationData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [approvalId, setApprovalId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Check location on component mount
  useEffect(() => {
    if (user && requireLocation) {
      checkLocationAccess();
    } else if (!requireLocation) {
      setLocationStatus('granted');
    }
  }, [user, requireLocation]);

  // Poll for approval status
  useEffect(() => {
    let pollInterval;
    if (locationStatus === 'pending' && approvalId) {
      pollInterval = setInterval(() => {
        checkApprovalStatus();
      }, 30000); // Check every 30 seconds
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [locationStatus, approvalId]);

  const checkLocationAccess = async () => {
    setLoading(true);
    try {
      // First check if user has existing approval
      const approvalCheck = await locationService.checkLocationApproval(user.id);
      
      if (approvalCheck.success && approvalCheck.hasValidApproval) {
        setLocationStatus('granted');
        setLocationData(approvalCheck.approval);
        setLoading(false);
        return;
      }

      // Validate current location
      const result = await locationService.validateOperatorAccess(user, true);
      
      if (result.success && result.access === 'granted') {
        setLocationStatus('granted');
        setLocationData(result);
      } else if (result.access === 'pending_approval') {
        setLocationStatus('pending');
        setLocationData(result);
        setApprovalId(result.approvalId);
      } else if (result.access === 'denied') {
        setLocationStatus('denied');
        setLocationData(result);
      } else {
        setLocationStatus('error');
        setErrorMessage(result.message || 'Location verification failed');
      }
    } catch (error) {
      console.error('Location check failed:', error);
      setLocationStatus('error');
      setErrorMessage(error.message || 'Unable to verify location');
    } finally {
      setLoading(false);
    }
  };

  const checkApprovalStatus = async () => {
    if (!approvalId) return;
    
    try {
      const approvalCheck = await locationService.checkLocationApproval(user.id);
      if (approvalCheck.success && approvalCheck.hasValidApproval) {
        setLocationStatus('granted');
        setLocationData(approvalCheck.approval);
      }
    } catch (error) {
      console.error('Approval status check failed:', error);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    checkLocationAccess();
  };

  const handleRequestApproval = async () => {
    setLoading(true);
    try {
      const result = await locationService.validateOperatorAccess(user, true);
      if (result.approvalId) {
        setApprovalId(result.approvalId);
        setLocationStatus('pending');
        setLocationData(result);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // If location not required, render children directly
  if (!requireLocation) {
    return children;
  }

  // Show loading state
  if (locationStatus === 'checking' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              <MapPin className="w-5 h-5 inline mr-2" />
              {isNepali ? 'स्थान जाँच गर्दै...' : 'Verifying Location...'}
            </h2>
            <p className="text-gray-600">
              {isNepali 
                ? 'कृपया पर्खनुहोस्, हामी तपाईंको स्थान प्रमाणित गर्दै छौं।'
                : 'Please wait while we verify your location for security purposes.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show granted access
  if (locationStatus === 'granted') {
    return (
      <>
        {/* Location status indicator */}
        <div className="bg-green-100 border-l-4 border-green-500 p-2 mb-4">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm text-green-800">
              {isNepali ? 'स्थान प्रमाणित' : 'Location Verified'}
            </span>
          </div>
        </div>
        {children}
      </>
    );
  }

  // Show pending approval state
  if (locationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {isNepali ? 'प्रशासकीय अनुमोदन आवश्यक' : 'Admin Approval Required'}
            </h2>
            
            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-800">
                  {isNepali ? 'स्थान जानकारी' : 'Location Details'}
                </span>
              </div>
              
              {locationData && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {isNepali ? 'फ्याक्ट्रीबाट दूरी:' : 'Distance from Factory:'}
                    </span>
                    <span className="font-semibold text-red-600">
                      {locationData.validation?.distance}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {isNepali ? 'अनुमतित दूरी:' : 'Allowed Distance:'}
                    </span>
                    <span className="font-semibold text-green-600">
                      {locationData.validation?.allowedRadius}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {isNepali ? 'स्थान सटीकता:' : 'Location Accuracy:'}
                    </span>
                    <span className="font-semibold">
                      ±{locationData.location?.accuracy}m
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">
                {isNepali ? 'के भइरहेको छ?' : "What's Happening?"}
              </h3>
              <p className="text-blue-700 text-sm">
                {isNepali 
                  ? 'तपाईं फ्याक्ट्री क्षेत्रबाहिर हुनुहुन्छ। प्रशासकलाई रिमोट एक्सेसको लागि अनुरोध पठाइएको छ।'
                  : 'You are outside the factory area. A request for remote access has been sent to the administrator.'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center text-yellow-600">
                <div className="animate-pulse flex space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                </div>
                <span className="ml-3 text-sm">
                  {isNepali ? 'प्रशासकको प्रतिक्षा गर्दै...' : 'Waiting for admin approval...'}
                </span>
              </div>
              
              <button
                onClick={checkApprovalStatus}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {isNepali ? 'स्थिति जाँच गर्नुहोस्' : 'Check Status'}
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              <p>
                {isNepali 
                  ? 'अनुरोध ID: ' + (approvalId?.slice(-8) || 'N/A')
                  : 'Request ID: ' + (approvalId?.slice(-8) || 'N/A')}
              </p>
              <p>
                {isNepali 
                  ? 'तत्काल सहायता चाहिए भने प्रशासकलाई सम्पर्क गर्नुहोस्।'
                  : 'Contact administrator if you need immediate assistance.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied state
  if (locationStatus === 'denied') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {isNepali ? 'पहुँच अस्वीकृत' : 'Access Denied'}
            </h2>
            
            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <span className="font-medium text-red-800">
                  {isNepali ? 'स्थान आवश्यकता पूरा भएन' : 'Location Requirement Not Met'}
                </span>
              </div>
              
              {locationData && (
                <div className="space-y-2 text-sm">
                  <p className="text-red-700">
                    {isNepali 
                      ? `तपाईं फ्याक्ट्रीबाट ${locationData.validation?.distance}m टाढा हुनुहुन्छ।`
                      : `You are ${locationData.validation?.distance}m away from the factory.`}
                  </p>
                  <p className="text-red-700">
                    {isNepali 
                      ? `अधिकतम अनुमतित दूरी: ${locationData.validation?.allowedRadius}m`
                      : `Maximum allowed distance: ${locationData.validation?.allowedRadius}m`}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">
                {isNepali ? 'के गर्न सकिन्छ?' : 'What Can You Do?'}
              </h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• {isNepali ? 'फ्याक्ट्री परिसरमा जानुहोस्' : 'Go to the factory premises'}</li>
                <li>• {isNepali ? 'स्थान सेवा सक्षम गर्नुहोस्' : 'Enable location services'}</li>
                <li>• {isNepali ? 'रिमोट एक्सेसको लागि अनुरोध गर्नुहोस्' : 'Request remote access approval'}</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRetry}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    {isNepali ? 'जाँच गर्दै...' : 'Checking...'}
                  </div>
                ) : (
                  <>
                    {isNepali ? '🔄 पुनः प्रयास गर्नुहोस्' : '🔄 Try Again'}
                  </>
                )}
              </button>
              
              <button
                onClick={handleRequestApproval}
                disabled={loading}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {isNepali ? '📋 रिमोट एक्सेस माग्नुहोस्' : '📋 Request Remote Access'}
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              <p>
                {isNepali 
                  ? `प्रयास: ${retryCount + 1} | सुरक्षा कारणले यो आवश्यक छ।`
                  : `Attempt: ${retryCount + 1} | This is required for security purposes.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-gray-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {isNepali ? 'स्थान सेवा त्रुटि' : 'Location Service Error'}
          </h2>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-sm">
              {errorMessage || (isNepali ? 'स्थान पहुँच गर्न सकिएन' : 'Unable to access location')}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">
              {isNepali ? 'समाधान:' : 'Solutions:'}
            </h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• {isNepali ? 'ब्राउजरमा स्थान अनुमति दिनुहोस्' : 'Allow location permission in browser'}</li>
              <li>• {isNepali ? 'GPS सक्षम गर्नुहोस्' : 'Enable GPS on your device'}</li>
              <li>• {isNepali ? 'इन्टरनेट जडान जाँच गर्नुहोस्' : 'Check internet connection'}</li>
            </ul>
          </div>

          <button
            onClick={handleRetry}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                {isNepali ? 'पुनः प्रयास गर्दै...' : 'Retrying...'}
              </div>
            ) : (
              <>
                {isNepali ? '🔄 पुनः प्रयास गर्नुहोस्' : '🔄 Retry'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationGuard;
// src/components/operator/SelfAssignmentSystem.jsx
// Self Assignment System Component

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../context/NotificationContext";

const SelfAssignmentSystem = () => {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const { showNotification } = useNotifications();
  const [selectedWork, setSelectedWork] = useState(null);
  
  const isNepali = currentLanguage === 'np';

  // Mock available work items
  const availableWork = [
    {
      id: 'bundle_001',
      articleNumber: '8085',
      operation: isNepali ? 'काँध जोड्ने' : 'Shoulder Join',
      pieces: 30,
      rate: 2.50,
      priority: 'high',
      machineType: 'overlock'
    },
    {
      id: 'bundle_002',
      articleNumber: '2233',
      operation: isNepali ? 'साइड सिम' : 'Side Seam',
      pieces: 25,
      rate: 2.00,
      priority: 'normal',
      machineType: 'overlock'
    },
    {
      id: 'bundle_003',
      articleNumber: '6635',
      operation: isNepali ? 'हेम फोल्ड' : 'Hem Fold',
      pieces: 40,
      rate: 1.80,
      priority: 'low',
      machineType: 'flatlock'
    }
  ];

  const handleSelectWork = (work) => {
    setSelectedWork(work);
    showNotification(
      isNepali 
        ? `बन्डल ${work.id} छनोट गरियो`
        : `Bundle ${work.id} selected`,
      'info'
    );
  };

  const handleAcceptWork = () => {
    if (selectedWork) {
      showNotification(
        isNepali 
          ? `काम स्वीकार गरियो! ${selectedWork.operation}`
          : `Work accepted! ${selectedWork.operation}`,
        'success'
      );
      setSelectedWork(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isNepali ? 'काम छनोट गर्नुहोस्' : 'Self Assignment System'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isNepali 
            ? 'आफ्नो क्षमता अनुसार काम छान्नुहोस्'
            : 'Choose work based on your skills and availability'
          }
        </p>
      </div>

      {user?.currentWork ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            {isNepali ? 'हालको काम' : 'Current Work'}
          </h3>
          <p className="text-blue-700">
            {user.currentWork.operation} - {user.currentWork.pieces} {isNepali ? 'टुक्रा' : 'pieces'}
          </p>
          <div className="mt-2 bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${(user.currentWork.completed / user.currentWork.pieces) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            {user.currentWork.completed}/{user.currentWork.pieces} {isNepali ? 'पूरा' : 'completed'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableWork.map((work) => (
            <div
              key={work.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedWork?.id === work.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleSelectWork(work)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {work.articleNumber}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${
                  work.priority === 'high' ? 'bg-red-100 text-red-800' :
                  work.priority === 'normal' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {work.priority}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {work.operation}
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>{work.pieces} {isNepali ? 'टुक्रा' : 'pieces'}</p>
                <p>{isNepali ? 'दर' : 'Rate'}: Rs. {work.rate}</p>
                <p>{isNepali ? 'कुल' : 'Total'}: Rs. {(work.pieces * work.rate).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedWork && !user?.currentWork && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">
            {isNepali ? 'छनोट गरिएको काम' : 'Selected Work'}
          </h3>
          <p className="text-gray-700 mb-4">
            {selectedWork.operation} - {selectedWork.pieces} {isNepali ? 'टुक्रा' : 'pieces'}
            <br />
            {isNepali ? 'कुल कमाई' : 'Total earnings'}: Rs. {(selectedWork.pieces * selectedWork.rate).toFixed(2)}
          </p>
          <button
            onClick={handleAcceptWork}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isNepali ? 'काम स्वीकार गर्नुहोस्' : 'Accept Work'}
          </button>
        </div>
      )}

      {!user?.currentWork && availableWork.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>{isNepali ? 'कुनै काम उपलब्ध छैन' : 'No work available at the moment'}</p>
        </div>
      )}
    </div>
  );
};

export default SelfAssignmentSystem;
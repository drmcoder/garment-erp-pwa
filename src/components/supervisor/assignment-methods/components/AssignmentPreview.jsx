import React from 'react';
import { useLanguage } from '../../../../context/LanguageContext';
import { getMachineTypeIcon, getMachineTypeName } from '../../../../constants/machineTypes';

const AssignmentPreview = ({ assignments, onRemoveAssignment, onBulkConfirm }) => {
  const { currentLanguage } = useLanguage();

  if (Object.keys(assignments).length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-yellow-800 mb-4 flex items-center">
        <span className="mr-2">📋</span>
        {currentLanguage === 'np' ? 'असाइनमेन्ट पूर्वावलोकन' : 'Assignment Preview'}
      </h3>
      
      <div className="space-y-2">
        {Object.values(assignments).map((assignment) => (
          <div
            key={assignment.workItemId}
            className="flex items-center justify-between bg-white rounded p-3"
          >
            <div className="flex items-center space-x-3">
              <span>{getMachineTypeIcon(assignment.workItem.machineType)}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Bundle #{assignment.workItem.bundleNumber}</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-blue-600 font-medium">{assignment.operator.name}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  📅 {assignment.assignedAtNepali || new Date(assignment.assignedAt).toLocaleString(currentLanguage === 'np' ? 'ne-NP' : 'en-US')}
                </div>
              </div>
            </div>
            <button
              onClick={() => onRemoveAssignment(assignment.workItemId)}
              className="text-red-600 hover:text-red-800 p-1"
              title={currentLanguage === 'np' ? 'हटाउनुहोस्' : 'Remove'}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onBulkConfirm}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <span>✅</span>
          <span>
            {currentLanguage === 'np' 
              ? `${Object.keys(assignments).length} असाइनमेन्ट पुष्टि गर्नुहोस्`
              : `Confirm ${Object.keys(assignments).length} Assignments`
            }
          </span>
        </button>
      </div>
    </div>
  );
};

export default AssignmentPreview;
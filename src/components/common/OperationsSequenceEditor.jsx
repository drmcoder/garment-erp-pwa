import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const OperationsSequenceEditor = ({ onClose }) => {
  const { currentLanguage } = useLanguage();
  const isNepali = currentLanguage === 'np';

  // Sample operations that can be edited
  const [operations, setOperations] = useState([
    {
      id: 1,
      name: 'Cutting',
      nameNp: 'काटना',
      machineType: 'cutting',
      time: 0.5,
      rate: 1.0,
      skillLevel: 'easy',
      sequence: 1
    },
    {
      id: 2,
      name: 'Shoulder Join',
      nameNp: 'काँध जोड्ने',
      machineType: 'overlock',
      time: 2.5,
      rate: 2.5,
      skillLevel: 'easy',
      sequence: 2
    },
    {
      id: 3,
      name: 'Side Seam',
      nameNp: 'साइड सिम',
      machineType: 'overlock',
      time: 3.0,
      rate: 3.0,
      skillLevel: 'easy',
      sequence: 3
    },
    {
      id: 4,
      name: 'Hem Fold',
      nameNp: 'हेम फोल्ड',
      machineType: 'flatlock',
      time: 1.5,
      rate: 2.0,
      skillLevel: 'easy',
      sequence: 4
    },
    {
      id: 5,
      name: 'Armhole',
      nameNp: 'आर्महोल',
      machineType: 'overlock',
      time: 2.0,
      rate: 2.5,
      skillLevel: 'medium',
      sequence: 5
    },
    {
      id: 6,
      name: 'Neckline',
      nameNp: 'नेकलाइन',
      machineType: 'flatlock',
      time: 2.5,
      rate: 3.0,
      skillLevel: 'hard',
      sequence: 6
    },
    {
      id: 7,
      name: 'Placket',
      nameNp: 'प्लाकेट',
      machineType: 'singleNeedle',
      time: 4.0,
      rate: 4.0,
      skillLevel: 'hard',
      sequence: 7
    },
    {
      id: 8,
      name: 'Buttonhole',
      nameNp: 'बटनहोल',
      machineType: 'buttonhole',
      time: 1.0,
      rate: 2.0,
      skillLevel: 'medium',
      sequence: 8
    }
  ]);

  const [editingOperation, setEditingOperation] = useState(null);

  const machineTypes = [
    'cutting',
    'overlock',
    'flatlock',
    'singleNeedle',
    'buttonhole',
    'iron'
  ];

  const skillLevels = ['easy', 'medium', 'hard'];

  const handleEditOperation = (operation) => {
    setEditingOperation({ ...operation });
  };

  const handleSaveOperation = () => {
    setOperations(operations.map(op => 
      op.id === editingOperation.id ? editingOperation : op
    ));
    setEditingOperation(null);
  };

  const handleDeleteOperation = (id) => {
    setOperations(operations.filter(op => op.id !== id));
  };

  const handleAddNewOperation = () => {
    const newId = Math.max(...operations.map(op => op.id)) + 1;
    const newOperation = {
      id: newId,
      name: 'New Operation',
      nameNp: 'नयाँ सञ्चालन',
      machineType: 'overlock',
      time: 1.0,
      rate: 2.0,
      skillLevel: 'easy',
      sequence: operations.length + 1
    };
    setOperations([...operations, newOperation]);
  };

  const handleSaveSequence = () => {
    // Save to localStorage for now (can be enhanced to save to Firebase)
    const sequenceData = {
      name: 'Custom Operations Sequence',
      operations: operations,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('customOperationsSequence', JSON.stringify(sequenceData));
    
    console.log('✅ Operations sequence saved:', sequenceData);
    alert(isNepali ? 'सञ्चालन क्रम बचत गरियो!' : 'Operations sequence saved!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {isNepali ? 'सञ्चालन क्रम सम्पादक' : 'Operations Sequence Editor'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleAddNewOperation}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {isNepali ? 'नयाँ सञ्चालन थप्नुहोस्' : 'Add New Operation'}
            </button>
            <button
              onClick={handleSaveSequence}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              {isNepali ? 'क्रम बचत गर्नुहोस्' : 'Save Sequence'}
            </button>
          </div>

          {/* Operations List */}
          <div className="space-y-4">
            {operations
              .sort((a, b) => a.sequence - b.sequence)
              .map((operation, index) => (
              <div key={operation.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold">
                      {operation.sequence}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {isNepali ? operation.nameNp : operation.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>🏭 {operation.machineType || 'N/A'}</span>
                        <span>⏱️ {operation.time || operation.estimatedTime || operation.estimatedTimePerPiece || 0} min</span>
                        <span>💰 Rs {operation.rate || 0}</span>
                        <span>⭐ {operation.skillLevel || 'medium'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditOperation(operation)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                    >
                      {isNepali ? 'सम्पादन' : 'Edit'}
                    </button>
                    <button
                      onClick={() => handleDeleteOperation(operation.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      {isNepali ? 'मेटाउनुहोस्' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-semibold">
                {isNepali ? 'सञ्चालन सम्पादन गर्नुहोस्' : 'Edit Operation'}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNepali ? 'नाम (अंग्रेजी)' : 'Name (English)'}
                </label>
                <input
                  type="text"
                  value={editingOperation.name}
                  onChange={(e) => setEditingOperation({...editingOperation, name: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNepali ? 'नाम (नेपाली)' : 'Name (Nepali)'}
                </label>
                <input
                  type="text"
                  value={editingOperation.nameNp}
                  onChange={(e) => setEditingOperation({...editingOperation, nameNp: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNepali ? 'मेसिन प्रकार' : 'Machine Type'}
                </label>
                <select
                  value={editingOperation.machineType}
                  onChange={(e) => setEditingOperation({...editingOperation, machineType: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                >
                  {machineTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNepali ? 'समय (मिनेट)' : 'Time (minutes)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editingOperation.time}
                  onChange={(e) => setEditingOperation({...editingOperation, time: parseFloat(e.target.value)})}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNepali ? 'दर (रुपैयाँ)' : 'Rate (Rs)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editingOperation.rate}
                  onChange={(e) => setEditingOperation({...editingOperation, rate: parseFloat(e.target.value)})}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNepali ? 'कौशल स्तर' : 'Skill Level'}
                </label>
                <select
                  value={editingOperation.skillLevel}
                  onChange={(e) => setEditingOperation({...editingOperation, skillLevel: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                >
                  {skillLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNepali ? 'क्रम संख्या' : 'Sequence Number'}
                </label>
                <input
                  type="number"
                  value={editingOperation.sequence}
                  onChange={(e) => setEditingOperation({...editingOperation, sequence: parseInt(e.target.value)})}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
            </div>
            
            <div className="border-t px-6 py-4 flex justify-end space-x-2">
              <button
                onClick={() => setEditingOperation(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveOperation}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {isNepali ? 'बचत गर्नुहोस्' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsSequenceEditor;
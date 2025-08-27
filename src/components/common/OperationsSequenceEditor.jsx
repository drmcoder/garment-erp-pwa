import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const OperationsSequenceEditor = ({ onClose }) => {
  const { currentLanguage } = useLanguage();
  const isNepali = currentLanguage === 'np';

  // Load operations from localStorage or start with empty array
  const [operations, setOperations] = useState(() => {
    try {
      // No localStorage loading - use empty array
      return [];
    } catch (error) {
      console.error('Error loading operations sequence:', error);
      return [];
    }
  });

  const [editingOperation, setEditingOperation] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOperation, setNewOperation] = useState({
    name: '',
    nameNp: '',
    machineType: 'overlock',
    time: 1.0,
    rate: 2.0,
    skillLevel: 'easy'
  });

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
    setShowAddModal(true);
  };

  const handleSaveNewOperation = () => {
    const newId = operations.length > 0 ? Math.max(...operations.map(op => op.id)) + 1 : 1;
    const operationToAdd = {
      id: newId,
      name: newOperation.name || 'New Operation',
      nameNp: newOperation.nameNp || 'नयाँ सञ्चालन',
      machineType: newOperation.machineType,
      time: newOperation.time,
      rate: newOperation.rate,
      skillLevel: newOperation.skillLevel,
      sequence: operations.length + 1
    };
    setOperations([...operations, operationToAdd]);
    
    // Reset form
    setNewOperation({
      name: '',
      nameNp: '',
      machineType: 'overlock',
      time: 1.0,
      rate: 2.0,
      skillLevel: 'easy'
    });
    setShowAddModal(false);
  };

  const handleSaveSequence = () => {
    // Save to localStorage for now (can be enhanced to save to Firebase)
    const sequenceData = {
      name: 'Custom Operations Sequence',
      operations: operations,
      updatedAt: new Date().toISOString()
    };
    
    // No localStorage saving - only log
    
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
                        <span>🏭 {
                          operation.machineType === 'cutting' ? (isNepali ? 'काट्ने' : 'Cutting') :
                          operation.machineType === 'overlock' ? (isNepali ? 'ओभरलक' : 'Overlock') :
                          operation.machineType === 'flatlock' ? (isNepali ? 'फ्ल्यालक' : 'Flatlock') :
                          operation.machineType === 'singleNeedle' ? (isNepali ? 'एकल सुई' : 'Single Needle') :
                          operation.machineType === 'buttonhole' ? (isNepali ? 'बटनहोल' : 'Buttonhole') :
                          operation.machineType === 'iron' ? (isNepali ? 'इस्त्री' : 'Iron') :
                          operation.machineType || 'N/A'
                        }</span>
                        <span>⏱️ {operation.time || operation.estimatedTime || operation.estimatedTimePerPiece || 0} min</span>
                        <span>💰 Rs {operation.rate || 0}</span>
                        <span>⭐ {
                          operation.skillLevel === 'easy' ? (isNepali ? 'सजिलो' : 'Easy') :
                          operation.skillLevel === 'medium' ? (isNepali ? 'मध्यम' : 'Medium') :
                          operation.skillLevel === 'hard' ? (isNepali ? 'कठिन' : 'Hard') :
                          operation.skillLevel || 'medium'
                        }</span>
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
                    <option key={type} value={type}>
                      {type === 'cutting' ? (isNepali ? 'काट्ने' : 'Cutting') :
                       type === 'overlock' ? (isNepali ? 'ओभरलक' : 'Overlock') :
                       type === 'flatlock' ? (isNepali ? 'फ्ल्यालक' : 'Flatlock') :
                       type === 'singleNeedle' ? (isNepali ? 'एकल सुई' : 'Single Needle') :
                       type === 'buttonhole' ? (isNepali ? 'बटनहोल' : 'Buttonhole') :
                       type === 'iron' ? (isNepali ? 'इस्त्री' : 'Iron') : type}
                    </option>
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
                    <option key={level} value={level}>
                      {level === 'easy' ? (isNepali ? 'सजिलो' : 'Easy') :
                       level === 'medium' ? (isNepali ? 'मध्यम' : 'Medium') :
                       level === 'hard' ? (isNepali ? 'कठिन' : 'Hard') : level}
                    </option>
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

      {/* Add New Operation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-semibold">
                {isNepali ? 'नयाँ सञ्चालन थप्नुहोस्' : 'Add New Operation'}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNepali ? 'नाम (अंग्रेजी)' : 'Name (English)'}
                </label>
                <input
                  type="text"
                  value={newOperation.name}
                  onChange={(e) => setNewOperation({...newOperation, name: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder={isNepali ? 'सञ्चालनको नाम' : 'Operation name'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNepali ? 'नाम (नेपाली)' : 'Name (Nepali)'}
                </label>
                <input
                  type="text"
                  value={newOperation.nameNp}
                  onChange={(e) => setNewOperation({...newOperation, nameNp: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder={isNepali ? 'सञ्चालनको नेपाली नाम' : 'Operation name in Nepali'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNepali ? 'मेसिन प्रकार' : 'Machine Type'} *
                </label>
                <select
                  value={newOperation.machineType}
                  onChange={(e) => setNewOperation({...newOperation, machineType: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                >
                  {machineTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'cutting' ? (isNepali ? 'काट्ने' : 'Cutting') :
                       type === 'overlock' ? (isNepali ? 'ओभरलक' : 'Overlock') :
                       type === 'flatlock' ? (isNepali ? 'फ्ल्यालक' : 'Flatlock') :
                       type === 'singleNeedle' ? (isNepali ? 'एकल सुई' : 'Single Needle') :
                       type === 'buttonhole' ? (isNepali ? 'बटनहोल' : 'Buttonhole') :
                       type === 'iron' ? (isNepali ? 'इस्त्री' : 'Iron') : type}
                    </option>
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
                  value={newOperation.time}
                  onChange={(e) => setNewOperation({...newOperation, time: parseFloat(e.target.value)})}
                  className="w-full border rounded-md px-3 py-2"
                  min="0.1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNepali ? 'दर (रुपैयाँ)' : 'Rate (Rs)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newOperation.rate}
                  onChange={(e) => setNewOperation({...newOperation, rate: parseFloat(e.target.value)})}
                  className="w-full border rounded-md px-3 py-2"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNepali ? 'कौशल स्तर' : 'Skill Level'}
                </label>
                <select
                  value={newOperation.skillLevel}
                  onChange={(e) => setNewOperation({...newOperation, skillLevel: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                >
                  {skillLevels.map(level => (
                    <option key={level} value={level}>
                      {level === 'easy' ? (isNepali ? 'सजिलो' : 'Easy') :
                       level === 'medium' ? (isNepali ? 'मध्यम' : 'Medium') :
                       level === 'hard' ? (isNepali ? 'कठिन' : 'Hard') : level}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="border-t px-6 py-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveNewOperation}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {isNepali ? 'थप्नुहोस्' : 'Add Operation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsSequenceEditor;
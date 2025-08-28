import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationContext } from '../../context/NotificationContext';
import { db, doc, updateDoc, COLLECTIONS } from '../../config/firebase';

const MachineSpecialitySelector = ({ onClose, onUpdate }) => {
  const { user, refreshUser } = useContext(AuthContext);
  const { isNepali } = useContext(LanguageContext);
  const { showNotification } = useContext(NotificationContext);
  
  const [selectedMachine, setSelectedMachine] = useState(user?.machine || user?.speciality || '');
  const [loading, setLoading] = useState(false);

  const machineTypes = [
    { 
      id: 'overlock', 
      english: 'Overlock Machine', 
      nepali: 'ओभरलक मेसिन',
      description: isNepali ? 'किनारा सिलाई र काट्ने काम' : 'Edge finishing and trimming'
    },
    { 
      id: 'flatlock', 
      english: 'Flatlock Machine', 
      nepali: 'फ्ल्याटलक मेसिन',
      description: isNepali ? 'समतल सिलाई काम' : 'Flat seam stitching'
    },
    { 
      id: 'single-needle', 
      english: 'Single Needle Machine', 
      nepali: 'एकल सुई मेसिन',
      description: isNepali ? 'सीधा सिलाई काम' : 'Straight line stitching'
    },
    { 
      id: 'buttonhole', 
      english: 'Buttonhole Machine', 
      nepali: 'बटनहोल मेसिन',
      description: isNepali ? 'बटनको प्वाल बनाउने काम' : 'Buttonhole creation'
    },
    { 
      id: 'buttonAttach', 
      english: 'Button Attach Machine', 
      nepali: 'बटन जोड्ने मेसिन',
      description: isNepali ? 'बटन जोड्ने काम' : 'Button attachment'
    },
    { 
      id: 'iron', 
      english: 'Iron Press', 
      nepali: 'इस्त्री प्रेस',
      description: isNepali ? 'कपडा प्रेस गर्ने काम' : 'Garment pressing and finishing'
    },
    { 
      id: 'cutting', 
      english: 'Cutting Machine', 
      nepali: 'काट्ने मेसिन',
      description: isNepali ? 'कपडा काट्ने काम' : 'Fabric cutting'
    },
    { 
      id: 'manual', 
      english: 'Manual Work', 
      nepali: 'हस्तकला काम',
      description: isNepali ? 'हातले गर्ने काम' : 'Hand finishing work'
    }
  ];

  const handleSave = async () => {
    if (!selectedMachine) {
      showNotification(
        isNepali ? 'कृपया मेसिनको प्रकार चयन गर्नुहोस्' : 'Please select a machine type',
        'error'
      );
      return;
    }

    setLoading(true);
    try {
      // Update user document with machine speciality
      const userRef = doc(db, user.role === 'operator' ? COLLECTIONS.OPERATORS : COLLECTIONS.SUPERVISORS, user.id);
      await updateDoc(userRef, {
        machine: selectedMachine,
        speciality: selectedMachine, // For backward compatibility
        updatedAt: new Date()
      });

      // Refresh user data
      await refreshUser();

      showNotification(
        isNepali ? 'मेसिन विशेषता सफलतापूर्वक अपडेट गरियो' : 'Machine speciality updated successfully',
        'success'
      );

      if (onUpdate) onUpdate(selectedMachine);
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to update machine speciality:', error);
      showNotification(
        isNepali ? 'मेसिन विशेषता अपडेट गर्न असफल' : 'Failed to update machine speciality',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {isNepali ? 'मेसिन विशेषता चयन गर्नुहोस्' : 'Select Machine Speciality'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={loading}
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 text-sm mb-4">
              {isNepali 
                ? 'कृपया आफ्नो मुख्य मेसिन विशेषता चयन गर्नुहोस्। यसले तपाईंलाई उपयुक्त काम मिलाउन मद्दत गर्नेछ।'
                : 'Please select your primary machine speciality. This will help match you with suitable work assignments.'
              }
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {machineTypes.map((machine) => (
              <div
                key={machine.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMachine === machine.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedMachine(machine.id)}
              >
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    name="machine"
                    value={machine.id}
                    checked={selectedMachine === machine.id}
                    onChange={() => setSelectedMachine(machine.id)}
                    className="mr-3"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {isNepali ? machine.nepali : machine.english}
                    </h3>
                    <p className="text-sm text-gray-600">{machine.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !selectedMachine}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading 
                ? (isNepali ? 'सेभ गर्दै...' : 'Saving...') 
                : (isNepali ? 'सेभ गर्नुहोस्' : 'Save')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineSpecialitySelector;
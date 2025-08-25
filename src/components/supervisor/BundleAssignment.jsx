
import React, { useState, useEffect } from 'react';
import { BundleService, OperatorService } from '../../services/firebase-services';

const BundleAssignment = () => {
  const [availableBundles, setAvailableBundles] = useState([]);
  const [operators, setOperators] = useState([]);

  useEffect(() => {
    loadAvailableBundles();
    loadOperators();
  }, []);

  // Auto-refresh operators every 30 seconds to catch new users
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadOperators();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const loadAvailableBundles = async () => {
    const result = await BundleService.getAvailableBundles();
    if (result.success) {
      setAvailableBundles(result.bundles);
    }
  };

  const loadOperators = async () => {
    try {
      // Use OperatorService to fetch real operators from Firestore
      const result = await OperatorService.getActiveOperators();
      
      if (result.success && result.operators.length > 0) {
        // Filter for active operators and format for component
        const activeOperators = result.operators
          .filter(op => op.isActive)
          .map(op => ({
            id: op.id,
            name: op.name,
            speciality: op.machine || op.machineType || 'General',
            efficiency: op.efficiency || 85,
            status: op.currentBundle ? 'working' : 'available'
          }));
        setOperators(activeOperators);
        console.log('Loaded operators from Firestore:', activeOperators.length);
      } else {
        // Start with empty array if no operators found
        setOperators([]);
        console.log('No operators found in Firestore');
      }
    } catch (error) {
      console.error('Error loading operators from Firestore:', error);
      setOperators([]);
    }
  };

  const assignBundle = async (bundleId, operatorId) => {
    const result = await BundleService.assignBundle(bundleId, operatorId, 'sup001');
    if (result.success) {
      alert('Bundle assigned successfully!');
      loadAvailableBundles();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">📦 Bundle Assignment</h1>
          <p className="text-gray-600 mt-1">Assign bundles to operators</p>
        </div>
        
        <div className="p-6">
          {availableBundles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              <p>No bundles available for assignment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableBundles.map(bundle => (
                <div key={bundle.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                    <div>
                      <div className="text-sm text-gray-500">Article</div>
                      <div className="font-medium">#{bundle.article} - {bundle.articleName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Details</div>
                      <div className="font-medium">Size: {bundle.size} | Pieces: {bundle.pieces}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Operation</div>
                      <div className="font-medium">{bundle.currentOperation}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Assign To</div>
                      <select 
                        onChange={(e) => e.target.value && assignBundle(bundle.id, e.target.value)}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Operator</option>
                        {operators.map(operator => (
                          <option key={operator.id} value={operator.id}>
                            {operator.name} ({operator.speciality})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BundleAssignment;
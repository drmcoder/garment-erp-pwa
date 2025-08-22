
import React, { useState, useEffect } from 'react';
import { BundleService } from '../../services/firebase-services';

const BundleAssignment = () => {
  const [availableBundles, setAvailableBundles] = useState([]);
  const [operators, setOperators] = useState([]);

  useEffect(() => {
    loadAvailableBundles();
    loadActiveOperators();
  }, []);

  const loadAvailableBundles = async () => {
    const result = await BundleService.getAvailableBundles();
    if (result.success) {
      setAvailableBundles(result.bundles);
    }
  };

  const loadActiveOperators = async () => {
    // Demo operators - in production this would load from Firebase
    setOperators([
      { id: 'op001', name: 'राम सिंह', machine: 'Overlock' },
      { id: 'op002', name: 'सीता देवी', machine: 'Flatlock' },
      { id: 'op003', name: 'हरि बहादुर', machine: 'Single Needle' }
    ]);
  };

  const assignBundle = async (bundleId, operatorId) => {
    const result = await BundleService.assignBundle(bundleId, operatorId, 'sup001');
    if (result.success) {
      alert('Bundle assigned successfully!');
      loadAvailableBundles();
    }
  };

  return (
    <div>
      <h2>Bundle Assignment</h2>
      
      {availableBundles.map(bundle => (
        <div key={bundle.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <p>{bundle.article}# - {bundle.articleName}</p>
          <p>Size: {bundle.size} | Pieces: {bundle.pieces}</p>
          <p>Operation: {bundle.currentOperation}</p>
          
          <select onChange={(e) => e.target.value && assignBundle(bundle.id, e.target.value)}>
            <option value="">Select Operator</option>
            {operators.map(operator => (
              <option key={operator.id} value={operator.id}>
                {operator.name} ({operator.machine})
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};

export default BundleAssignment;
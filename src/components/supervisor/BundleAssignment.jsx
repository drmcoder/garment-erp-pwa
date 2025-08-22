
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

  const assignBundle = async (bundleId, operatorId) => {
    const result = await BundleService.assignBundle(bundleId, operatorId, 'sup001');
    if (result.success) {
      alert('Bundle assigned successfully!');
      loadAvailableBundles();
    }
  };

  return (Bundle Assignment{availableBundles.map(bundle => ({bundle.article}# - {bundle.articleName}Size: {bundle.size} | Pieces: {bundle.pieces}Operation: {bundle.currentOperation}<select onChange={(e) => e.target.value && assignBundle(bundle.id, e.target.value)}>Select Operator
राम सिंह (Overlock)
            सीता देवी (Flatlock)
            हरि बहादुर (Single Needle)
          
        
      ))}
    
  );
};

export default BundleAssignment;
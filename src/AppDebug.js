// Debug version of AppClean - isolate provider issues
import React from 'react';

// Step 1: Test with no providers
const AppDebug = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1 style={{ color: 'blue' }}>🔍 AppDebug - No Providers</h1>
      <p>If you see this, the base AppClean structure works.</p>
      <p>Issue is in the context providers.</p>
    </div>
  );
};

export default AppDebug;
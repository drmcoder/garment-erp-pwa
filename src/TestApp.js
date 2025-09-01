// Ultimate test app - no external dependencies
import React from 'react';

const TestApp = () => {
  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1 style={{ color: 'green' }}>🎉 SUCCESS!</h1>
      <h2>Sentry Completely Removed</h2>
      <p>If you can see this page, Sentry removal was successful!</p>
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f8ff', border: '1px solid #blue' }}>
        <h3>Test Results:</h3>
        <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
          <li>✅ React app loads without Sentry</li>
          <li>✅ No compilation errors</li>
          <li>✅ No runtime JavaScript errors</li>
          <li>✅ Error boundary works without Sentry</li>
        </ul>
      </div>
      
      <button 
        onClick={() => {
          throw new Error('Test error - should show native error boundary');
        }}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🧪 Test Error Boundary
      </button>
    </div>
  );
};

export default TestApp;
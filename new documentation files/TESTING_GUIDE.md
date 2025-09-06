# 🧪 Garment ERP PWA - Testing Guide

## 📋 Table of Contents
- [Testing Overview](#testing-overview)
- [Testing Setup](#testing-setup)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [User Acceptance Testing](#user-acceptance-testing)
- [Mobile Testing](#mobile-testing)
- [Testing Checklist](#testing-checklist)

---

## 🎯 Testing Overview

### **Testing Philosophy**
The Garment ERP PWA follows a comprehensive testing strategy to ensure reliability, performance, and user satisfaction across all manufacturing workflows.

### **Testing Pyramid**
```
           /\
          /  \    E2E Tests (5%)
         /____\   - User journey tests
        /      \  - Cross-browser tests
       / INTEG  \ Integration Tests (25%)
      /  TESTS  \ - API integration
     /__________\ - Component integration
    /            \
   /    UNIT      \ Unit Tests (70%)
  /    TESTS      \ - Component tests
 /________________\ - Service tests
                    - Utility tests
```

### **Testing Tools Stack**
```javascript
// Unit & Integration Testing
Jest                // Test framework
React Testing Library // Component testing
Firebase Rules Test  // Firebase security rules

// E2E Testing  
Cypress            // End-to-end testing
Playwright         // Cross-browser testing

// Performance Testing
Lighthouse         // Web performance
WebPageTest       // Real-world performance

// Code Quality
ESLint            // Code linting
SonarJS           // Code quality analysis
```

---

## ⚙️ Testing Setup

### **1. Install Testing Dependencies**
```bash
# Core testing framework
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Firebase testing
npm install --save-dev @firebase/rules-unit-testing

# E2E testing
npm install --save-dev cypress @cypress/react

# Performance testing
npm install --save-dev lighthouse cypress-audit
```

### **2. Jest Configuration**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### **3. Testing Environment Setup**
```javascript
// src/setupTests.js
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock Firebase
jest.mock('./config/firebase', () => ({
  db: {},
  auth: {},
  collection: jest.fn(),
  doc: jest.fn()
}));

// Mock service workers
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

---

## 🔬 Unit Testing

### **1. Component Testing**
```javascript
// src/components/operator/__tests__/WorkCompletion.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkCompletion } from '../WorkCompletion';
import { AuthProvider } from '../../contexts/AuthContext';

const renderWithProviders = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('WorkCompletion Component', () => {
  const mockProps = {
    bundleId: 'B001',
    onWorkCompleted: jest.fn(),
    onCancel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders work completion form correctly', () => {
    renderWithProviders(<WorkCompletion {...mockProps} />);
    
    expect(screen.getByText('Complete Work')).toBeInTheDocument();
    expect(screen.getByLabelText('Completed Pieces:')).toBeInTheDocument();
    expect(screen.getByLabelText('Quality Score:')).toBeInTheDocument();
  });

  test('validates required fields before submission', async () => {
    renderWithProviders(<WorkCompletion {...mockProps} />);
    
    const submitButton = screen.getByText('Complete Work');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Completed pieces required')).toBeInTheDocument();
    });
  });

  test('prevents completion when damage reports are unresolved', async () => {
    const mockDamageCheck = jest.fn().mockResolvedValue({
      hasUnresolvedDamage: true,
      pendingPieces: 2
    });
    
    renderWithProviders(<WorkCompletion {...mockProps} />);
    
    // Mock the damage check function
    jest.spyOn(require('../../../services/DamageReportService'), 'checkBundleDamageStatus')
      .mockImplementation(mockDamageCheck);

    const submitButton = screen.getByText('Complete Work');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Payment held! 2 pieces in rework/)).toBeInTheDocument();
    });
  });
});
```

### **2. Service Testing**
```javascript
// src/services/__tests__/DamageReportService.test.js
import { DamageReportService } from '../DamageReportService';
import { writeBatch, doc, updateDoc } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore');

describe('DamageReportService', () => {
  let damageService;

  beforeEach(() => {
    damageService = new DamageReportService();
    jest.clearAllMocks();
  });

  describe('submitDamageReport', () => {
    test('holds bundle payment when damage is reported', async () => {
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue()
      };
      writeBatch.mockReturnValue(mockBatch);

      const reportData = {
        bundleId: 'B001',
        operatorId: 'OP001',
        pieceNumbers: [5, 8],
        damageType: 'cutting_error',
        pieces: 20,
        rate: 15
      };

      const result = await damageService.submitDamageReport(reportData);

      expect(result.success).toBe(true);
      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          paymentStatus: 'HELD_FOR_DAMAGE',
          heldAmount: 300, // 20 pieces * 15 rate
          canWithdraw: false
        })
      );
    });
  });

  describe('releaseBundlePayment', () => {
    test('releases payment when all work is completed', async () => {
      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn().mockResolvedValue()
      };
      writeBatch.mockReturnValue(mockBatch);

      const result = await damageService.releaseBundlePayment('B001', 'OP001');

      expect(result.success).toBe(true);
      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          paymentStatus: 'RELEASED',
          canWithdraw: true
        })
      );
    });
  });
});
```

### **3. Utility Testing**
```javascript
// src/lib/__tests__/workflowManager.test.js
import { workflowStateManager, operationSequencer } from '../workflowManager';
import { WORKFLOW_TYPES } from '../../constants/appConstants';

describe('Workflow Manager', () => {
  describe('workflowStateManager', () => {
    test('creates workflow with initial state', () => {
      const definition = {
        type: WORKFLOW_TYPES.SEQUENTIAL,
        steps: [
          { id: 'cut', name: 'Cut Fabric' },
          { id: 'sew', name: 'Sew Pieces' }
        ]
      };

      const workflow = workflowStateManager.createWorkflow(definition);

      expect(workflow.currentStep).toBe('cut');
      expect(workflow.completedSteps).toEqual([]);
      expect(workflow.status).toBe('active');
    });

    test('progresses sequential workflow correctly', () => {
      const workflow = {
        definition: { type: WORKFLOW_TYPES.SEQUENTIAL, steps: [
          { id: 'cut', name: 'Cut' },
          { id: 'sew', name: 'Sew' }
        ]},
        currentStep: 'cut',
        completedSteps: []
      };

      const progressed = workflowStateManager.progressWorkflow(workflow);

      expect(progressed.currentStep).toBe('sew');
      expect(progressed.completedSteps).toContain('cut');
    });

    test('handles parallel workflow correctly', () => {
      const workflow = {
        definition: { type: WORKFLOW_TYPES.PARALLEL, steps: [
          { id: 'sleeves', name: 'Make Sleeves' },
          { id: 'body', name: 'Make Body' }
        ]},
        currentStep: 'sleeves',
        completedSteps: []
      };

      const progressed = workflowStateManager.progressWorkflow(workflow);

      expect(progressed.completedSteps).toContain('sleeves');
      // In parallel workflow, next step could be any incomplete step
      expect(['body', null]).toContain(progressed.currentStep);
    });
  });

  describe('operationSequencer', () => {
    test('inserts operation at correct position', () => {
      const sequence = {
        operations: [
          { id: 'op1', sequence: 1 },
          { id: 'op2', sequence: 2 }
        ]
      };
      const newOp = { id: 'op1.5', name: 'Middle Operation' };

      const updated = operationSequencer.insertOperation(
        sequence, 
        newOp, 
        'AFTER_CURRENT', 
        'op1'
      );

      expect(updated.operations).toHaveLength(3);
      expect(updated.operations[1].id).toBe('op1.5');
    });

    test('validates dependencies correctly', () => {
      const sequence = {
        operations: [
          { id: 'op1', dependencies: [] },
          { id: 'op2', dependencies: ['op1'] },
          { id: 'op3', dependencies: ['op1', 'op2'] }
        ]
      };

      expect(operationSequencer.canStartOperation(sequence, 'op1', [])).toBe(true);
      expect(operationSequencer.canStartOperation(sequence, 'op2', [])).toBe(false);
      expect(operationSequencer.canStartOperation(sequence, 'op2', ['op1'])).toBe(true);
      expect(operationSequencer.canStartOperation(sequence, 'op3', ['op1'])).toBe(false);
      expect(operationSequencer.canStartOperation(sequence, 'op3', ['op1', 'op2'])).toBe(true);
    });
  });
});
```

---

## 🔗 Integration Testing

### **1. Firebase Integration Testing**
```javascript
// src/services/__tests__/firebase-integration.test.js
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

describe('Firebase Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'garment-erp-test',
      firestore: {
        rules: require('../../firestore.rules')
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('operators can only read their own work items', async () => {
    const operatorDb = testEnv.authenticatedContext('operator1', {
      role: 'operator'
    }).firestore();

    // Should succeed - reading own work
    await assertSucceeds(
      operatorDb.collection('workItems')
        .where('operatorId', '==', 'operator1')
        .get()
    );

    // Should fail - reading someone else's work
    await assertFails(
      operatorDb.collection('workItems')
        .where('operatorId', '==', 'operator2')
        .get()
    );
  });

  test('supervisors can read all work items in their department', async () => {
    const supervisorDb = testEnv.authenticatedContext('supervisor1', {
      role: 'supervisor',
      department: 'sewing'
    }).firestore();

    await assertSucceeds(
      supervisorDb.collection('workItems')
        .where('department', '==', 'sewing')
        .get()
    );
  });

  test('damage reports hold bundle payments correctly', async () => {
    const operatorDb = testEnv.authenticatedContext('operator1').firestore();
    
    // Create damage report should trigger payment hold
    const damageReport = {
      bundleId: 'B001',
      operatorId: 'operator1',
      damageType: 'cutting_error',
      reportedAt: new Date()
    };

    await assertSucceeds(
      operatorDb.collection('damage_reports').add(damageReport)
    );

    // Check that bundle payment status is updated
    const bundleDoc = await operatorDb.collection('workItems').doc('B001').get();
    expect(bundleDoc.data().paymentStatus).toBe('HELD_FOR_DAMAGE');
  });
});
```

### **2. Component Integration Testing**
```javascript
// src/components/__tests__/workflow-integration.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OperatorDashboard } from '../operator/OperatorDashboard';
import { SupervisorDashboard } from '../supervisor/SupervisorDashboard';
import { CentralizedAppProvider } from '../../contexts/CentralizedAppProvider';

const renderWithFullContext = (component) => {
  return render(
    <CentralizedAppProvider>
      {component}
    </CentralizedAppProvider>
  );
};

describe('Cross-Component Workflow Integration', () => {
  test('damage report workflow integrates properly', async () => {
    // Setup: Render operator dashboard
    const { rerender } = renderWithFullContext(
      <OperatorDashboard userId="operator1" />
    );

    // Step 1: Operator reports damage
    const damageButton = screen.getByText('Report Damage');
    fireEvent.click(damageButton);

    const damageForm = screen.getByTestId('damage-report-form');
    fireEvent.change(screen.getByLabelText('Damage Type'), {
      target: { value: 'cutting_error' }
    });
    fireEvent.click(screen.getByText('Submit Report'));

    // Step 2: Verify payment is held
    await waitFor(() => {
      expect(screen.getByText(/Payment held/)).toBeInTheDocument();
    });

    // Step 3: Switch to supervisor view
    rerender(
      <CentralizedAppProvider>
        <SupervisorDashboard userId="supervisor1" />
      </CentralizedAppProvider>
    );

    // Step 4: Supervisor should see damage report
    await waitFor(() => {
      expect(screen.getByText('Damage Reports')).toBeInTheDocument();
      expect(screen.getByText(/cutting_error/)).toBeInTheDocument();
    });

    // Step 5: Supervisor completes rework
    const reworkButton = screen.getByText('Start Rework');
    fireEvent.click(reworkButton);

    fireEvent.click(screen.getByText('Complete Rework'));

    // Step 6: Return to operator view and verify payment release
    rerender(
      <CentralizedAppProvider>
        <OperatorDashboard userId="operator1" />
      </CentralizedAppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Payment released/)).toBeInTheDocument();
    });
  });
});
```

---

## 🚀 E2E Testing

### **1. Cypress E2E Tests**
```javascript
// cypress/e2e/complete-workflow.cy.js
describe('Complete Manufacturing Workflow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
  });

  it('completes full workflow from assignment to payment', () => {
    // Login as supervisor
    cy.login('supervisor1', 'test123');
    cy.url().should('include', '/supervisor');

    // Assign work to operator
    cy.get('[data-testid="work-assignment"]').click();
    cy.get('[data-testid="bundle-B001"]').click();
    cy.get('[data-testid="operator-john"]').click();
    cy.get('[data-testid="assign-work-btn"]').click();
    
    cy.get('.notification').should('contain', 'Work assigned successfully');

    // Switch to operator view
    cy.logout();
    cy.login('john', 'test123');
    cy.url().should('include', '/operator');

    // Operator sees assigned work
    cy.get('[data-testid="work-queue"]')
      .should('contain', 'Bundle B001')
      .should('contain', '20 pieces')
      .should('contain', 'Rs 15 per piece');

    // Start work
    cy.get('[data-testid="start-work-B001"]').click();
    cy.get('.work-status').should('contain', 'In Progress');

    // Complete work
    cy.get('[data-testid="complete-work-B001"]').click();
    cy.get('[data-testid="pieces-completed"]').type('20');
    cy.get('[data-testid="quality-score"]').type('95');
    cy.get('[data-testid="time-spent"]').type('120');
    cy.get('[data-testid="submit-completion"]').click();

    // Verify payment
    cy.get('[data-testid="wallet-available"]').should('contain', '300');
    cy.get('.notification').should('contain', 'Payment of Rs 300 added');
  });

  it('handles damage reporting and payment holds', () => {
    cy.login('john', 'test123');

    // Start work
    cy.get('[data-testid="start-work-B002"]').click();

    // Report damage
    cy.get('[data-testid="report-damage-B002"]').click();
    cy.get('[data-testid="damaged-pieces"]').click({ multiple: true });
    cy.get('[data-testid="damage-type"]').select('cutting_error');
    cy.get('[data-testid="damage-description"]').type('Fabric tore during cutting');
    cy.get('[data-testid="submit-damage"]').click();

    // Verify payment hold
    cy.get('[data-testid="wallet-held"]').should('contain', '450'); // 30 pieces * 15
    cy.get('[data-testid="wallet-available"]').should('not.contain', '450');
    cy.get('.notification').should('contain', 'Bundle payment held');

    // Switch to supervisor
    cy.logout();
    cy.login('supervisor1', 'test123');

    // Handle damage report
    cy.get('[data-testid="damage-reports-queue"]')
      .should('contain', 'cutting_error')
      .should('contain', 'john');

    cy.get('[data-testid="start-rework"]').first().click();
    cy.get('[data-testid="rework-time"]').type('45');
    cy.get('[data-testid="quality-passed"]').check();
    cy.get('[data-testid="complete-rework"]').click();
    cy.get('[data-testid="return-to-operator"]').click();

    // Switch back to operator
    cy.logout();
    cy.login('john', 'test123');

    // Complete remaining work
    cy.get('.notification').should('contain', 'Reworked pieces ready');
    cy.get('[data-testid="complete-work-B002"]').click();
    cy.get('[data-testid="pieces-completed"]').type('30');
    cy.get('[data-testid="submit-completion"]').click();

    // Verify payment release
    cy.get('[data-testid="wallet-available"]').should('contain', '450');
    cy.get('[data-testid="wallet-held"]').should('contain', '0');
    cy.get('.notification').should('contain', 'Payment released');
  });
});

// Custom commands
Cypress.Commands.add('login', (username, password) => {
  cy.get('[data-testid="username"]').type(username);
  cy.get('[data-testid="password"]').type(password);
  cy.get('[data-testid="login-btn"]').click();
  cy.wait(1000); // Wait for login to complete
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-btn"]').click();
});
```

### **2. Cross-Browser Testing**
```javascript
// cypress/e2e/cross-browser.cy.js
describe('Cross-Browser Compatibility', () => {
  const browsers = ['chrome', 'firefox', 'edge'];
  
  browsers.forEach(browser => {
    it(`works correctly in ${browser}`, () => {
      cy.visit('/', { 
        browser: browser,
        viewport: 'desktop' 
      });
      
      // Test core functionality
      cy.login('operator1', 'test123');
      cy.get('[data-testid="work-queue"]').should('be.visible');
      cy.get('[data-testid="wallet-balance"]').should('be.visible');
      
      // Test real-time updates
      cy.get('[data-testid="notifications"]').should('be.visible');
      
      // Test responsive design
      cy.viewport('iphone-x');
      cy.get('[data-testid="mobile-menu"]').should('be.visible');
      cy.get('[data-testid="work-queue"]').should('be.visible');
    });
  });
});
```

---

## ⚡ Performance Testing

### **1. Lighthouse Performance Tests**
```javascript
// cypress/e2e/performance.cy.js
describe('Performance Testing', () => {
  it('meets performance benchmarks', () => {
    cy.visit('/');
    
    // Run Lighthouse audit
    cy.lighthouse({
      performance: 85,
      accessibility: 90,
      'best-practices': 85,
      seo: 80,
      pwa: 90
    });
  });

  it('loads quickly under slow network conditions', () => {
    // Simulate slow 3G
    cy.throttle('slow-3g');
    
    const start = Date.now();
    cy.visit('/');
    cy.get('[data-testid="login-form"]').should('be.visible');
    
    const loadTime = Date.now() - start;
    expect(loadTime).to.be.lessThan(5000); // 5 seconds max
  });

  it('handles concurrent users efficiently', () => {
    // Simulate multiple user sessions
    const sessions = [];
    
    for (let i = 0; i < 10; i++) {
      sessions.push(
        cy.session(`user${i}`, () => {
          cy.visit('/');
          cy.login(`operator${i}`, 'test123');
          cy.get('[data-testid="work-queue"]').should('be.visible');
        })
      );
    }
    
    // All sessions should complete within reasonable time
    Promise.all(sessions).then(() => {
      cy.log('All 10 concurrent sessions loaded successfully');
    });
  });
});
```

### **2. Load Testing**
```javascript
// load-test/basic-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 10 },   // Stay at 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  },
};

export default function () {
  // Test login
  const loginResponse = http.post('https://your-app.com/api/auth/login', {
    username: `operator${Math.floor(Math.random() * 100)}`,
    password: 'test123'
  });
  
  check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'login response time': (r) => r.timings.duration < 1000,
  });

  // Test work assignment
  const workResponse = http.get('https://your-app.com/api/work/assigned', {
    headers: { Authorization: `Bearer ${loginResponse.json().token}` }
  });
  
  check(workResponse, {
    'work data loaded': (r) => r.status === 200,
    'work response time': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

---

## 🔒 Security Testing

### **1. Authentication & Authorization Tests**
```javascript
// cypress/e2e/security.cy.js
describe('Security Testing', () => {
  it('prevents unauthorized access to protected routes', () => {
    // Try accessing protected routes without login
    cy.visit('/supervisor/dashboard');
    cy.url().should('include', '/login');

    cy.visit('/admin/users');
    cy.url().should('include', '/login');
  });

  it('enforces role-based access control', () => {
    // Login as operator
    cy.login('operator1', 'test123');

    // Try accessing supervisor routes
    cy.visit('/supervisor/dashboard');
    cy.url().should('include', '/unauthorized');
    
    // Try accessing admin routes
    cy.visit('/admin/users');
    cy.url().should('include', '/unauthorized');
  });

  it('validates input to prevent XSS attacks', () => {
    cy.login('operator1', 'test123');
    
    // Try injecting script in damage description
    cy.get('[data-testid="report-damage"]').click();
    cy.get('[data-testid="damage-description"]')
      .type('<script>alert("XSS")</script>');
    cy.get('[data-testid="submit-damage"]').click();
    
    // Script should be escaped/sanitized
    cy.get('.damage-description')
      .should('not.contain', '<script>')
      .should('contain', '&lt;script&gt;');
  });

  it('protects sensitive data in localStorage/sessionStorage', () => {
    cy.login('operator1', 'test123');
    
    cy.window().then((win) => {
      const localStorage = win.localStorage;
      const sessionStorage = win.sessionStorage;
      
      // Check that passwords are not stored
      Object.values(localStorage).forEach(value => {
        expect(value).not.to.contain('test123');
      });
      
      // Check that tokens are properly secured
      const token = localStorage.getItem('auth_token');
      if (token) {
        expect(token).to.be.a('string');
        expect(token.length).to.be.greaterThan(10);
      }
    });
  });
});
```

### **2. Firebase Security Rules Testing**
```javascript
// tests/firestore-rules.test.js
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeEach(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: { rules: require('../firestore.rules') }
    });
  });

  test('operators cannot read other operators work', async () => {
    const operatorAuth = testEnv.authenticatedContext('operator1', {
      role: 'operator'
    });
    
    const firestore = operatorAuth.firestore();
    
    // Should fail - trying to read another operator's work
    await firebase.assertFails(
      firestore.collection('workItems')
        .where('operatorId', '==', 'operator2')
        .get()
    );
  });

  test('supervisors can only modify work in their department', async () => {
    const supervisorAuth = testEnv.authenticatedContext('supervisor1', {
      role: 'supervisor',
      department: 'sewing'
    });
    
    const firestore = supervisorAuth.firestore();
    
    // Should succeed - modifying work in own department
    await firebase.assertSucceeds(
      firestore.collection('workItems')
        .doc('work_sewing_001')
        .update({ status: 'assigned' })
    );
    
    // Should fail - modifying work in different department
    await firebase.assertFails(
      firestore.collection('workItems')
        .doc('work_cutting_001')
        .update({ status: 'assigned' })
    );
  });
});
```

---

## ✅ User Acceptance Testing

### **1. UAT Test Cases**
```javascript
// uat-tests/operator-workflows.spec.js
describe('Operator User Acceptance Tests', () => {
  const testUser = {
    username: 'uat_operator',
    password: 'uat_test_123',
    role: 'operator'
  };

  beforeEach(() => {
    cy.createTestUser(testUser);
    cy.login(testUser.username, testUser.password);
  });

  it('UAT-001: Operator can complete assigned work and receive payment', () => {
    // Given: Operator has assigned work
    cy.assignWorkToOperator(testUser.username, {
      bundleId: 'UAT-B001',
      pieces: 25,
      rate: 12,
      operation: 'Sleeve Attachment'
    });

    // When: Operator completes the work
    cy.get('[data-testid="work-UAT-B001"]').click();
    cy.get('[data-testid="start-work"]').click();
    cy.get('[data-testid="complete-work"]').click();
    
    cy.get('[data-testid="pieces-completed"]').type('25');
    cy.get('[data-testid="quality-score"]').type('92');
    cy.get('[data-testid="submit-completion"]').click();

    // Then: Payment should be added to wallet
    cy.get('[data-testid="wallet-available"]')
      .should('contain', '300'); // 25 * 12 = 300
    
    cy.get('.notification')
      .should('contain', 'Work completed successfully')
      .should('contain', 'Rs 300 added to wallet');
  });

  it('UAT-002: Damage reporting holds payment until resolved', () => {
    // Given: Operator starts work on bundle
    cy.get('[data-testid="work-UAT-B002"]').click();
    cy.get('[data-testid="start-work"]').click();

    // When: Operator reports damage
    cy.get('[data-testid="report-damage"]').click();
    cy.get('[data-testid="piece-7"]').click();
    cy.get('[data-testid="piece-12"]').click();
    cy.get('[data-testid="damage-type"]').select('Cutting Error');
    cy.get('[data-testid="damage-description"]')
      .type('Thread broke, fabric slightly torn');
    cy.get('[data-testid="submit-damage"]').click();

    // Then: Bundle payment should be held
    cy.get('[data-testid="wallet-held"]')
      .should('contain', '600'); // Bundle value held
    
    cy.get('.notification')
      .should('contain', 'Bundle payment held')
      .should('contain', 'pending damage resolution');

    // And: Supervisor should receive notification
    cy.switchToUser('supervisor1');
    cy.get('[data-testid="damage-reports"]')
      .should('contain', 'Cutting Error')
      .should('contain', testUser.username);
  });
});
```

### **2. Business Process Testing**
```javascript
// uat-tests/end-to-end-business-process.spec.js
describe('Complete Manufacturing Process UAT', () => {
  it('UAT-BP-001: Complete garment manufacturing workflow', () => {
    // Phase 1: Admin creates production batch
    cy.loginAs('admin');
    cy.createProductionBatch({
      articleNumber: '8085',
      totalPieces: 100,
      operations: ['cutting', 'sewing', 'finishing'],
      targetCompletion: '2025-02-15'
    });

    // Phase 2: Supervisor assigns cutting work
    cy.loginAs('supervisor_cutting');
    cy.assignWork({
      operation: 'cutting',
      operator: 'cutter_1',
      pieces: 100,
      rate: 5
    });

    // Phase 3: Cutter completes work
    cy.loginAs('cutter_1');
    cy.completeWork({
      bundleId: 'generated_cutting_bundle',
      piecesCompleted: 100,
      qualityScore: 95
    });

    // Phase 4: Work automatically flows to sewing
    cy.loginAs('supervisor_sewing');
    cy.get('[data-testid="pending-work"]')
      .should('contain', 'Cut pieces ready for sewing');

    // Phase 5: Sewing work assigned and completed
    cy.assignWork({
      operation: 'sewing',
      operator: 'sewer_1',
      pieces: 100,
      rate: 15
    });

    cy.loginAs('sewer_1');
    cy.completeWork({
      bundleId: 'generated_sewing_bundle',
      piecesCompleted: 98, // 2 pieces damaged
      qualityScore: 88
    });

    // Phase 6: Damage handling
    cy.reportDamage({
      pieces: [45, 67],
      damageType: 'Stitch Error',
      description: 'Uneven stitching on shoulder seam'
    });

    cy.loginAs('supervisor_sewing');
    cy.handleDamageReport({
      reportId: 'generated_damage_report',
      reworkTime: 30,
      resolution: 'Re-stitched shoulder seams'
    });

    // Phase 7: Final completion and payment
    cy.loginAs('sewer_1');
    cy.completeRemainingWork();
    
    cy.get('[data-testid="wallet-available"]')
      .should('contain', '1500'); // 100 pieces * 15 rate

    // Phase 8: Quality check and final approval
    cy.loginAs('quality_controller');
    cy.performQualityCheck({
      bundleId: 'generated_sewing_bundle',
      passed: true,
      score: 94
    });

    // Phase 9: Final reporting
    cy.loginAs('admin');
    cy.get('[data-testid="production-report"]')
      .should('contain', 'Article 8085: 100 pieces completed')
      .should('contain', 'Total cost: Rs 2000')
      .should('contain', 'Quality score: 94%');
  });
});
```

---

## 📱 Mobile Testing

### **1. Responsive Design Testing**
```javascript
// cypress/e2e/mobile.cy.js
describe('Mobile Responsiveness', () => {
  const viewports = [
    { device: 'iphone-6', width: 375, height: 667 },
    { device: 'iphone-x', width: 375, height: 812 },
    { device: 'samsung-s10', width: 360, height: 760 },
    { device: 'ipad-2', width: 768, height: 1024 }
  ];

  viewports.forEach(({ device, width, height }) => {
    it(`works correctly on ${device}`, () => {
      cy.viewport(width, height);
      cy.visit('/');
      
      // Test login on mobile
      cy.get('[data-testid="mobile-login-form"]').should('be.visible');
      cy.login('operator1', 'test123');
      
      // Test mobile navigation
      cy.get('[data-testid="mobile-menu-toggle"]').click();
      cy.get('[data-testid="mobile-nav-menu"]').should('be.visible');
      
      // Test work queue on mobile
      cy.get('[data-testid="work-queue"]').should('be.visible');
      cy.get('[data-testid="work-card"]').should('have.css', 'width').and('match', /100%|auto/);
      
      // Test damage reporting modal on mobile
      cy.get('[data-testid="report-damage"]').first().click();
      cy.get('[data-testid="damage-modal"]')
        .should('be.visible')
        .should('have.css', 'width')
        .and('match', /90%|95%/);
    });
  });
});
```

### **2. Touch Interface Testing**
```javascript
describe('Touch Interactions', () => {
  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.visit('/');
    cy.login('operator1', 'test123');
  });

  it('supports touch gestures for work management', () => {
    // Test swipe to reveal actions
    cy.get('[data-testid="work-card"]')
      .first()
      .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] })
      .trigger('touchmove', { touches: [{ clientX: 50, clientY: 100 }] })
      .trigger('touchend');
    
    cy.get('[data-testid="swipe-actions"]').should('be.visible');
    
    // Test long press for context menu
    cy.get('[data-testid="work-card"]')
      .first()
      .trigger('touchstart')
      .wait(800) // Long press duration
      .trigger('touchend');
    
    cy.get('[data-testid="context-menu"]').should('be.visible');
  });

  it('handles piece selection with touch', () => {
    cy.get('[data-testid="report-damage"]').click();
    
    // Test multi-touch selection of pieces
    cy.get('[data-testid="piece-grid"] .piece-button')
      .each(($el, index) => {
        if (index < 3) { // Select first 3 pieces
          cy.wrap($el).trigger('touchstart').trigger('touchend');
        }
      });
    
    cy.get('[data-testid="selected-pieces"]')
      .should('contain', '3 pieces selected');
  });
});
```

---

## ✅ Testing Checklist

### **Pre-Release Testing Checklist**

#### **Functionality Tests**
- [ ] User authentication (login/logout)
- [ ] Role-based access control
- [ ] Work assignment workflows
- [ ] Work completion processes
- [ ] Damage reporting system
- [ ] Payment hold/release logic
- [ ] Real-time notifications
- [ ] Language switching
- [ ] Self-assignment system
- [ ] Supervisor damage handling
- [ ] Admin user management

#### **Integration Tests**
- [ ] Firebase authentication integration
- [ ] Firestore database operations
- [ ] Real-time listener functionality
- [ ] Cross-component communication
- [ ] Service layer integration
- [ ] Error boundary functionality

#### **Performance Tests**
- [ ] Page load times (<3 seconds)
- [ ] API response times (<500ms)
- [ ] Large dataset handling
- [ ] Concurrent user support
- [ ] Memory usage optimization
- [ ] Network efficiency

#### **Security Tests**
- [ ] Authentication bypass attempts
- [ ] Authorization escalation tests
- [ ] Input validation/sanitization
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Data encryption verification

#### **Compatibility Tests**
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest version)
- [ ] Edge (latest version)
- [ ] Mobile Chrome/Safari
- [ ] Tablet responsiveness

#### **Accessibility Tests**
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast ratios
- [ ] Focus indicators
- [ ] Alternative text for images
- [ ] ARIA labels

#### **PWA Tests**
- [ ] Service worker functionality
- [ ] Offline capability
- [ ] App installation
- [ ] Push notifications
- [ ] Background sync
- [ ] Caching strategies

### **Test Coverage Targets**
- Unit Tests: >85%
- Integration Tests: >70%
- E2E Test Coverage: All critical paths
- Performance: Lighthouse score >85
- Accessibility: WCAG 2.1 AA compliance

### **Testing Tools Commands**
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run performance tests
npm run test:performance

# Run security tests
npm run test:security

# Run mobile tests
npm run test:mobile
```

---

This comprehensive testing guide ensures the Garment ERP PWA meets high standards for reliability, performance, and user experience across all manufacturing workflows and user roles.
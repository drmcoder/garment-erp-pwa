# Garment ERP PWA - Developer Guide

## Table of Contents
1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Debugging Guide](#debugging-guide)
7. [Contributing Guidelines](#contributing-guidelines)
8. [Best Practices](#best-practices)

## Development Environment Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v8.x or higher
- **Git**: Latest version
- **VSCode** (recommended) with extensions:
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint
  - Firebase Explorer
  - GitLens
  - Auto Rename Tag

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/your-org/garment-erp-pwa.git
cd garment-erp-pwa

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.development
# Edit .env.development with your Firebase config

# Start development server
npm start
```

### Firebase Setup for Development
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set up local project
firebase use --add
# Select your development project
# Give it an alias like 'dev'

# Set up Firestore emulators (optional for development)
firebase init emulators
# Select Firestore and Authentication
```

### VSCode Configuration
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "emmet.triggerExpansionOnTab": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/build": true,
    "**/.git": true
  }
}
```

## Project Structure

```
garment-erp-pwa/
├── public/                     # Static files
│   ├── index.html             # Main HTML template
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
├── src/
│   ├── components/            # React components
│   │   ├── admin/            # Admin-specific components
│   │   ├── common/           # Shared components
│   │   ├── management/       # Management components
│   │   ├── operator/         # Operator components
│   │   └── supervisor/       # Supervisor components
│   ├── config/               # Configuration files
│   │   ├── firebase.js       # Firebase configuration
│   │   └── constants.js      # App constants
│   ├── context/              # React contexts
│   │   ├── AuthContext.jsx   # Authentication context
│   │   ├── LanguageContext.jsx # i18n context
│   │   └── NotificationContext.jsx # Notifications
│   ├── hooks/                # Custom React hooks
│   │   ├── useAppData.js     # Centralized data hooks
│   │   └── useLocalStorage.js # Utility hooks
│   ├── services/             # API services
│   │   ├── firebase-services.js # Firebase services
│   │   └── ErrorHandlingService.js # Error handling
│   ├── store/                # State management
│   │   ├── AppStore.js       # Zustand store
│   │   └── CentralizedAppProvider.jsx # Provider
│   ├── styles/               # CSS/styling
│   │   ├── index.css         # Global styles
│   │   └── tailwind.css      # Tailwind imports
│   ├── utils/                # Utility functions
│   │   ├── dateUtils.js      # Date utilities
│   │   ├── nepaliDate.js     # Nepali date conversion
│   │   └── validation.js     # Form validation
│   ├── App.js                # Main App component
│   └── index.js              # Entry point
├── docs/                     # Documentation
├── tests/                    # Test files
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
├── firebase.json            # Firebase configuration
├── firestore.rules          # Firestore security rules
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS config
└── README.md               # Project readme
```

### Component Organization
```
components/
├── common/                  # Reusable components
│   ├── Button/
│   │   ├── Button.jsx
│   │   ├── Button.test.js
│   │   └── index.js
│   ├── Modal/
│   ├── LoadingSpinner/
│   └── ErrorBoundary/
├── operator/               # Role-specific components
│   ├── Dashboard/
│   ├── WorkQueue/
│   └── SelfAssignment/
└── supervisor/
    ├── Dashboard/
    ├── WorkAssignment/
    └── QualityControl/
```

## Development Workflow

### Git Workflow
We follow **Git Flow** branching strategy:

```
main/master     # Production-ready code
├── develop     # Integration branch
├── feature/*   # Feature branches
├── hotfix/*    # Hot fixes
└── release/*   # Release preparation
```

### Branch Naming Convention
- `feature/user-authentication`
- `bugfix/work-assignment-error`
- `hotfix/critical-login-issue`
- `release/v1.2.0`

### Commit Message Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add operator self-assignment feature
fix: resolve work item loading issue
docs: update API documentation
style: format code with prettier
refactor: centralize data management
test: add work assignment unit tests
chore: update dependencies
```

### Pull Request Process
1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Develop and Test**
   - Write code following standards
   - Add/update tests
   - Test locally
   - Update documentation

3. **Submit Pull Request**
   - Push branch to origin
   - Create PR from feature branch to develop
   - Fill PR template
   - Request reviews

4. **Code Review Process**
   - Address reviewer feedback
   - Ensure CI/CD passes
   - Merge when approved

### Daily Development Process
```bash
# Start of day
git checkout develop
git pull origin develop
git checkout feature/your-branch
git merge develop  # Keep up to date

# Development
npm start          # Start dev server
npm test           # Run tests in watch mode

# Before commit
npm test -- --coverage  # Full test run
npm run lint           # Check linting
npm run build          # Verify build works

# Commit and push
git add .
git commit -m "feat: implement feature"
git push origin feature/your-branch
```

## Coding Standards

### JavaScript/React Standards

#### General Principles
- **Functional Components**: Use function components with hooks
- **ES6+ Syntax**: Use modern JavaScript features
- **Consistent Naming**: Follow naming conventions
- **Single Responsibility**: Each component/function has one purpose

#### Component Structure
```javascript
// ComponentName.jsx
import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import { useWorkManagement } from '../../hooks/useAppData';
import './ComponentName.css'; // If component-specific styles needed

const ComponentName = ({ 
  prop1, 
  prop2, 
  onAction,
  className = '',
  ...rest 
}) => {
  // 1. Hooks (in order: state, context, custom hooks, effects)
  const [localState, setLocalState] = useState('');
  const { user } = useAuth();
  const { data, loading } = useWorkManagement();
  
  // 2. Computed values
  const computedValue = useMemo(() => {
    return data?.filter(item => item.status === 'active');
  }, [data]);
  
  // 3. Effect hooks
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 4. Event handlers
  const handleClick = (event) => {
    event.preventDefault();
    onAction?.(event.target.value);
  };
  
  // 5. Early returns (loading, error states)
  if (loading) return <LoadingSpinner />;
  if (!data) return <ErrorMessage />;
  
  // 6. Main render
  return (
    <div className={`component-name ${className}`} {...rest}>
      <h2>{prop1}</h2>
      <button onClick={handleClick}>
        {prop2}
      </button>
    </div>
  );
};

// PropTypes definition
ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.string,
  onAction: PropTypes.func,
  className: PropTypes.string
};

export default ComponentName;
```

#### Naming Conventions
```javascript
// Components: PascalCase
const UserProfile = () => {};

// Variables/functions: camelCase
const userName = 'john';
const getUserData = () => {};

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// Files/folders: kebab-case
user-profile.jsx
work-assignment/

// CSS classes: kebab-case
.user-profile {}
.work-assignment-card {}
```

### Custom Hooks Pattern
```javascript
// hooks/useWorkManagement.js
import { useCallback } from 'react';
import { useAppStore } from '../store/AppStore';
import { shallow } from 'zustand/shallow';

export const useWorkManagement = () => {
  const {
    bundles,
    workItems,
    assignWork,
    loading
  } = useAppStore(state => ({
    bundles: state.bundles,
    workItems: state.workItems,
    assignWork: state.assignWork,
    loading: state.loading.workItems
  }), shallow);
  
  const handleWorkAssignment = useCallback(async (operatorId, workData) => {
    try {
      const result = await assignWork(operatorId, workData);
      return result;
    } catch (error) {
      console.error('Work assignment failed:', error);
      throw error;
    }
  }, [assignWork]);
  
  return {
    bundles,
    workItems,
    assignWork: handleWorkAssignment,
    loading
  };
};
```

### Service Layer Pattern
```javascript
// services/WorkService.js
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  serverTimestamp 
} from '../config/firebase';

export class WorkService {
  static async createWorkItem(workData) {
    try {
      const docRef = await addDoc(collection(db, 'workItems'), {
        ...workData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        success: true,
        id: docRef.id
      };
    } catch (error) {
      console.error('Failed to create work item:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  static async updateWorkStatus(workItemId, status) {
    try {
      await updateDoc(doc(db, 'workItems', workItemId), {
        status,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update work status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

### Error Handling Pattern
```javascript
// utils/errorHandler.js
export const handleAsyncError = (asyncFn) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      console.error('Async operation failed:', error);
      
      // Report to error monitoring service
      ErrorReportingService.reportError(error, {
        function: asyncFn.name,
        arguments: args
      });
      
      throw error;
    }
  };
};

// Usage
const safeAssignWork = handleAsyncError(assignWork);
```

### CSS/Styling Standards

#### Tailwind CSS Usage
```javascript
// Preferred: Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
    Action
  </button>
</div>

// Avoid: Custom CSS unless necessary
<div className="custom-card">
  <h2 className="custom-title">Title</h2>
  <button className="custom-button">Action</button>
</div>
```

#### Component-Specific Styles
```css
/* components/WorkCard/WorkCard.css */
.work-card {
  @apply bg-white rounded-lg shadow-md p-4 border border-gray-200;
}

.work-card--urgent {
  @apply border-red-500 bg-red-50;
}

.work-card__header {
  @apply flex items-center justify-between mb-3;
}
```

### TypeScript Guidelines (if implemented)
```typescript
// types/work.types.ts
export interface WorkItem {
  id: string;
  bundleId: string;
  operatorId: string;
  status: 'assigned' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  pieces: number;
  estimatedTime: number;
  actualTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkAssignmentData {
  bundleId: string;
  operation: string;
  pieces: number;
  priority: WorkItem['priority'];
  estimatedTime: number;
}
```

## Testing Guidelines

### Testing Strategy
- **Unit Tests**: Individual functions/components
- **Integration Tests**: Component interactions
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Load and stress testing

### Unit Testing with Jest & React Testing Library
```javascript
// components/WorkCard/WorkCard.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import WorkCard from './WorkCard';

// Mock external dependencies
jest.mock('../../hooks/useWorkManagement', () => ({
  useWorkManagement: () => ({
    assignWork: jest.fn(),
    loading: false
  })
}));

describe('WorkCard Component', () => {
  const mockWorkItem = {
    id: '1',
    bundleNumber: 'B001',
    operation: 'Sewing',
    pieces: 50,
    priority: 'high',
    status: 'pending'
  };
  
  const mockOperator = {
    id: 'op1',
    name: 'John Doe',
    status: 'available'
  };
  
  it('renders work item information correctly', () => {
    render(
      <WorkCard 
        workItem={mockWorkItem} 
        operator={mockOperator}
        onAssign={jest.fn()}
      />
    );
    
    expect(screen.getByText('B001')).toBeInTheDocument();
    expect(screen.getByText('Sewing')).toBeInTheDocument();
    expect(screen.getByText('50 pieces')).toBeInTheDocument();
  });
  
  it('calls onAssign when assign button is clicked', async () => {
    const mockOnAssign = jest.fn();
    
    render(
      <WorkCard 
        workItem={mockWorkItem} 
        operator={mockOperator}
        onAssign={mockOnAssign}
      />
    );
    
    const assignButton = screen.getByText('Assign');
    fireEvent.click(assignButton);
    
    await waitFor(() => {
      expect(mockOnAssign).toHaveBeenCalledWith(mockOperator.id, mockWorkItem);
    });
  });
  
  it('shows high priority indicator for urgent work', () => {
    render(
      <WorkCard 
        workItem={mockWorkItem} 
        operator={mockOperator}
        onAssign={jest.fn()}
      />
    );
    
    const priorityIndicator = screen.getByTestId('priority-indicator');
    expect(priorityIndicator).toHaveClass('priority-high');
  });
});
```

### Integration Testing
```javascript
// components/WorkAssignmentBoard/WorkAssignmentBoard.integration.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../../store/CentralizedAppProvider';
import WorkAssignmentBoard from './WorkAssignmentBoard';

const renderWithProvider = (component) => {
  return render(
    <AppProvider>
      {component}
    </AppProvider>
  );
};

describe('Work Assignment Integration', () => {
  it('completes full work assignment flow', async () => {
    renderWithProvider(<WorkAssignmentBoard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Available Work')).toBeInTheDocument();
    });
    
    // Find and assign work
    const workItem = screen.getByTestId('work-item-1');
    const operator = screen.getByTestId('operator-card-1');
    
    // Drag and drop simulation
    fireEvent.dragStart(workItem);
    fireEvent.drop(operator);
    
    // Verify assignment
    await waitFor(() => {
      expect(screen.getByText('Work assigned successfully')).toBeInTheDocument();
    });
  });
});
```

### E2E Testing with Cypress
```javascript
// cypress/integration/work-assignment.spec.js
describe('Work Assignment Flow', () => {
  beforeEach(() => {
    // Login as supervisor
    cy.login('supervisor@example.com', 'password');
    cy.visit('/supervisor/work-assignment');
  });
  
  it('assigns work to operator successfully', () => {
    // Wait for page to load
    cy.get('[data-testid="work-assignment-board"]').should('be.visible');
    
    // Select work item
    cy.get('[data-testid="work-item"]').first().click();
    
    // Select operator
    cy.get('[data-testid="operator-card"]').first().click();
    
    // Confirm assignment
    cy.get('[data-testid="assign-button"]').click();
    
    // Verify success
    cy.get('.notification-success').should('contain', 'Work assigned successfully');
    
    // Verify work appears in operator queue
    cy.get('[data-testid="operator-work-queue"]').should('contain', 'B001');
  });
});
```

### Test Utilities
```javascript
// tests/test-utils.js
import React from 'react';
import { render } from '@testing-library/react';
import { AppProvider } from '../src/store/CentralizedAppProvider';

// Custom render with providers
export const renderWithProviders = (
  ui,
  {
    preloadedState = {},
    ...renderOptions
  } = {}
) => {
  function Wrapper({ children }) {
    return <AppProvider>{children}</AppProvider>;
  }
  
  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'operator',
  status: 'available',
  ...overrides
});

export const createMockWorkItem = (overrides = {}) => ({
  id: 'work-1',
  bundleNumber: 'B001',
  operation: 'Sewing',
  pieces: 50,
  priority: 'medium',
  status: 'pending',
  ...overrides
});
```

## Debugging Guide

### React Developer Tools
1. Install React DevTools browser extension
2. Use Components tab to inspect component state
3. Use Profiler tab to identify performance issues

### Firebase Debugging
```javascript
// Enable Firestore debug logging
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Debug network state
window.enableFirestoreNetwork = () => enableNetwork(db);
window.disableFirestoreNetwork = () => disableNetwork(db);

// Add to console for debugging
window.db = db;
```

### Redux DevTools for Zustand
```javascript
// store/AppStore.js
import { devtools } from 'zustand/middleware';

const useAppStore = create(
  devtools(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: 'garment-erp-store', // Name in devtools
    }
  )
);
```

### Common Debugging Techniques

#### Console Debugging
```javascript
// Temporary debug logs (remove before commit)
console.log('🐛 Debug:', data);
console.warn('⚠️ Warning:', warning);
console.error('❌ Error:', error);

// Use labeled console groups
console.group('Work Assignment Process');
console.log('Operator:', operator);
console.log('Work Data:', workData);
console.groupEnd();
```

#### React Error Boundaries
```javascript
// components/ErrorBoundary/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Report to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      ErrorReportingService.reportError(error, errorInfo);
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### Performance Debugging
```javascript
// Measure component render performance
import { Profiler } from 'react';

const onRenderCallback = (id, phase, actualDuration) => {
  console.log(`⚡ Component ${id} ${phase}: ${actualDuration}ms`);
};

<Profiler id="WorkAssignmentBoard" onRender={onRenderCallback}>
  <WorkAssignmentBoard />
</Profiler>

// Measure custom operations
const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`📊 ${name}: ${end - start}ms`);
  return result;
};
```

## Contributing Guidelines

### Before Contributing
1. Read the project documentation
2. Set up development environment
3. Understand the architecture
4. Check existing issues and PRs

### Making Contributions

#### Bug Reports
```markdown
## Bug Report

**Describe the bug**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What should happen

**Screenshots**
Add screenshots if applicable

**Environment:**
- OS: [e.g. iOS]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]
```

#### Feature Requests
```markdown
## Feature Request

**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of what you want to happen

**Describe alternatives you've considered**
Any alternative solutions or features

**Additional context**
Screenshots, mockups, or additional context
```

#### Code Contributions
1. **Fork the repository**
2. **Create feature branch** from develop
3. **Follow coding standards**
4. **Add tests** for new functionality
5. **Update documentation** if needed
6. **Submit pull request** with clear description

### Code Review Process
- All code must be reviewed by at least 2 team members
- Address all review feedback
- Ensure CI/CD pipeline passes
- Update documentation for significant changes

### Git Hooks Setup
```bash
# Install pre-commit hooks
npm install --save-dev husky lint-staged

# Add to package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm test"
    }
  },
  "lint-staged": {
    "src/**/*.{js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## Best Practices

### Performance Best Practices

#### React Optimization
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.data.id === nextProps.data.id;
});

// Use useCallback for event handlers
const WorkCard = ({ workItem, onAssign }) => {
  const handleAssign = useCallback(() => {
    onAssign(workItem.id);
  }, [workItem.id, onAssign]);
  
  return <button onClick={handleAssign}>Assign</button>;
};

// Use useMemo for expensive calculations
const Dashboard = ({ workItems }) => {
  const statistics = useMemo(() => {
    return calculateComplexStatistics(workItems);
  }, [workItems]);
  
  return <StatisticsDisplay data={statistics} />;
};
```

#### Bundle Size Optimization
```javascript
// Lazy load components
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const SupervisorDashboard = lazy(() => import('./SupervisorDashboard'));

// Code splitting by route
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/supervisor" element={<SupervisorDashboard />} />
  </Routes>
</Suspense>

// Dynamic imports for large libraries
const loadChartLibrary = async () => {
  const { Chart } = await import('chart.js');
  return Chart;
};
```

### Security Best Practices

#### Input Validation
```javascript
// Validate all user inputs
const validateWorkData = (data) => {
  const errors = {};
  
  if (!data.bundleId || data.bundleId.trim() === '') {
    errors.bundleId = 'Bundle ID is required';
  }
  
  if (!data.pieces || data.pieces < 1) {
    errors.pieces = 'Pieces must be greater than 0';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Sanitize inputs before processing
const sanitizeInput = (input) => {
  return input.trim().replace(/[<>]/g, '');
};
```

#### Authentication Security
```javascript
// Never store sensitive data in localStorage
// Use Firebase Auth tokens which auto-expire
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  throw new Error('User not authenticated');
};

// Always validate permissions on sensitive operations
const requirePermission = (permission) => {
  return (WrappedComponent) => {
    return (props) => {
      const { hasPermission } = usePermissions();
      
      if (!hasPermission(permission)) {
        return <AccessDenied />;
      }
      
      return <WrappedComponent {...props} />;
    };
  };
};
```

### Accessibility Best Practices
```javascript
// Use semantic HTML
<main role="main">
  <header>
    <h1>Dashboard</h1>
  </header>
  <section aria-label="Work Queue">
    <h2>Current Work</h2>
    <ul role="list">
      <li role="listitem">Work Item 1</li>
    </ul>
  </section>
</main>

// Add proper ARIA attributes
<button 
  aria-label="Assign work to operator"
  aria-describedby="work-item-description"
  onClick={handleAssign}
>
  Assign
</button>

// Ensure keyboard navigation
<div 
  tabIndex={0}
  role="button"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleAction();
    }
  }}
>
  Interactive Element
</div>
```

### Documentation Standards
```javascript
/**
 * Assigns work item to an operator
 * @param {string} operatorId - ID of the operator
 * @param {Object} workData - Work assignment data
 * @param {string} workData.bundleId - Bundle identifier
 * @param {number} workData.pieces - Number of pieces
 * @param {string} workData.priority - Priority level (low|medium|high)
 * @returns {Promise<{success: boolean, error?: string}>} Assignment result
 * @example
 * const result = await assignWork('op123', {
 *   bundleId: 'bundle456',
 *   pieces: 50,
 *   priority: 'high'
 * });
 */
const assignWork = async (operatorId, workData) => {
  // Implementation
};
```

This developer guide provides comprehensive guidance for maintaining code quality, consistency, and best practices throughout the development lifecycle.
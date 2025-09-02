# 🏭 Kansai Machine Type Integration Guide

## Files Updated ✅
- `/src/components/supervisor/assignment-methods/DragDropAssignment.jsx`
- `/src/components/supervisor/assignment-methods/components/WorkItemCard.jsx`
- `/src/components/supervisor/assignment-methods/components/OperatorCard.jsx`
- `/src/components/supervisor/assignment-methods/components/AssignmentPreview.jsx`
- `/src/constants/machineTypes.js` (NEW centralized config)

## Files That Need Updates 📋

### 1. Sample Data (`/src/data/sampleData.js`)
Add kansai machine operators and work items:
```javascript
// Add to operators array
{
  id: 'kansai-operator-1',
  name: 'Kansai Operator',
  machine: 'kansai',
  station: 'kansai-1',
  // ... other fields
}

// Add to work items
{
  operation: 'kansai-binding',
  machine: 'kansai',
  // ... other fields
}
```

### 2. WIP Feature Config (`/src/config/wipFeatureConfig.js`)
Add kansai to machine utilization:
```javascript
machineUtilization: {
  overlock: 85,
  flatlock: 78,
  singleNeedle: 92,
  buttonhole: 75,
  kansai: 80  // ADD THIS
}
```

### 3. Other Assignment Methods
Update these files with kansai machine type:
- `/src/components/supervisor/assignment-methods/BundleCardAssignment.jsx`
- `/src/components/supervisor/assignment-methods/QuickActionAssignment.jsx`
- `/src/components/supervisor/assignment-methods/KanbanBoardAssignment.jsx`
- `/src/components/supervisor/assignment-methods/UserProfileAssignment.jsx`
- `/src/components/supervisor/assignment-methods/WIPBundleViewAssignment.jsx`
- `/src/components/supervisor/assignment-methods/BatchAssignmentInterface.jsx`

### 4. Work Assignment Components
- `/src/components/supervisor/WorkAssignment.jsx`
- `/src/components/supervisor/WorkAssignmentBoard.jsx`

### 5. Bundle Components
- `/src/components/common/BundleWorkflowCards.jsx`
- `/src/components/supervisor/WorkBundleCards.jsx`
- `/src/components/supervisor/BundleManager.jsx`

### 6. Operator Components
- `/src/components/operator/OperatorDashboard.jsx`
- `/src/components/operator/SelfAssignmentSystem.jsx`
- `/src/components/operator/SimpleWorkAssignment.jsx`
- `/src/components/operator/WorkQueue.jsx`

### 7. Admin Components
- `/src/components/admin/OperatorManagement.jsx`
- `/src/components/admin/UserManagement.jsx`
- `/src/components/admin/SupervisorManagement.jsx`

### 8. Template & Configuration
- `/src/components/supervisor/SewingProcedureConfig.jsx`
- `/src/components/supervisor/ProcessTemplateManager.jsx`
- `/src/components/supervisor/TemplateBuilder.jsx`
- `/src/components/common/OperationsSequenceEditor.jsx`

### 9. WIP & Data Processing
- `/src/components/supervisor/WIPManualEntry.jsx`
- `/src/utils/workChecklistManager.js`
- `/src/utils/advancedWIPParser.js`
- `/src/utils/layerBasedBundleGenerator.js`
- `/src/utils/wipDataParser.js`

### 10. Language Context
- `/src/context/LanguageContext.jsx` (if machine names are translated)

## Recommended Approach 🚀

1. **Use the centralized config**: Import from `/src/constants/machineTypes.js`
   ```javascript
   import { getMachineTypeIcon, getMachineTypeName, MACHINE_TYPES } from '../constants/machineTypes';
   ```

2. **Search and replace pattern**:
   - Find functions like `getMachineTypeIcon` in each file
   - Replace with import from constants
   - Add 'kansai' to any hardcoded arrays

3. **Update database/Firebase** if needed:
   - Add kansai operators
   - Add kansai work items
   - Update machine utilization tracking

4. **Test thoroughly**:
   - Create kansai operators
   - Create kansai work items  
   - Test drag & drop compatibility
   - Verify search functionality

## Icon Used: 🏭
The kansai machine uses the factory emoji (🏭) to represent industrial/special machinery.

## Database Fields to Update
```javascript
// Operators
machine: 'kansai'
station: 'kansai-1', 'kansai-2', etc.

// Work Items
machineType: 'kansai'
machine: 'kansai'
```
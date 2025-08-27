# 🎯 Centralized Constants System

## 📁 Files Created

### Core Constants
- `/src/constants/machineTypes.js` - Machine type definitions (including **kansai** & **double-needle**)
- `/src/constants/workStatuses.js` - Work status definitions  
- `/src/constants/userRoles.js` - User role definitions
- `/src/constants/skillLevels.js` - Skill level definitions
- `/src/constants/garmentSizes.js` - Size definitions (adult & kids)
- `/src/constants/priorities.js` - Priority level definitions
- `/src/constants/shifts.js` - Work shift definitions
- `/src/constants/index.js` - Master export file

## 🚀 Usage Examples

### Import Options

**Option 1: Import specific constants**
```javascript
import { MACHINE_TYPES, getMachineTypeIcon } from '../constants/machineTypes';
import { WORK_STATUSES, getWorkStatusName } from '../constants/workStatuses';
```

**Option 2: Import from master file**
```javascript
import { 
  getMachineTypeIcon, 
  getWorkStatusName,
  getUserRoleName,
  getSkillLevelName
} from '../constants';
```

**Option 3: Import everything**
```javascript
import * as Constants from '../constants';
```

### Basic Usage

```javascript
// Machine Types
const icon = getMachineTypeIcon('kansai'); // 🏭
const name = getMachineTypeName('double-needle', 'np'); // दोहोरो सुई

// Work Statuses  
const status = getWorkStatus('in-progress');
const statusName = getWorkStatusName('completed', 'np'); // सम्पन्न

// User Roles
const hasAccess = hasPermission('supervisor', 'assign_work'); // true
const roleName = getUserRoleName('operator', 'np'); // संचालक

// Skill Levels
const multiplier = getSkillMultiplier('expert'); // 1.4
const targetEff = getTargetEfficiency('beginner'); // 75

// Sizes
const sizeName = getGarmentSizeName('xl', 'np'); // अति ठूलो

// Priorities
const isUrgent = isHigherPriority('urgent', 'normal'); // true
const priorityClasses = getPriorityClasses('high'); // { bg: 'bg-orange-100', ... }

// Shifts
const currentShift = getCurrentShift(); // { id: 'morning', name: 'Morning Shift', ... }
const shiftTime = getShiftTimeRange('evening'); // "16:00 - 24:00"
```

### Component Integration

```jsx
import React from 'react';
import { getMachineTypeIcon, getWorkStatusName, getPriorityClasses } from '../constants';

const WorkItemCard = ({ item, language }) => {
  const statusName = getWorkStatusName(item.status, language);
  const priorityClasses = getPriorityClasses(item.priority);
  
  return (
    <div className={`border rounded p-4 ${priorityClasses.bg}`}>
      <div className="flex items-center space-x-2">
        <span className="text-lg">{getMachineTypeIcon(item.machineType)}</span>
        <h3>Bundle #{item.bundleNumber}</h3>
      </div>
      <div className={`text-sm ${priorityClasses.text}`}>
        Status: {statusName}
      </div>
    </div>
  );
};
```

### Dropdown Options

```jsx
import { getMachineTypeOptions, getWorkStatusOptions } from '../constants';

const MachineSelect = ({ value, onChange, language }) => {
  const options = getMachineTypeOptions(language);
  
  return (
    <select value={value} onChange={onChange}>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.icon} {option.label}
        </option>
      ))}
    </select>
  );
};
```

### Advanced Usage

```javascript
// Generic constant getter
import { getConstant, getConstantName, getConstantOptions } from '../constants';

const machineIcon = getConstant('machine', 'kansai');
const statusName = getConstantName('status', 'completed', 'np');
const roleOptions = getConstantOptions('role', 'en');
```

## 🎨 New Machine Types Added

### Machine Icons
- **single-needle**: 📍 (Single Needle)
- **double-needle**: 📌 (Double Needle) ⭐ NEW
- **overlock**: 🔗 (Overlock)
- **flatlock**: 📎 (Flatlock)  
- **buttonhole**: 🕳️ (Buttonhole)
- **cutting**: ✂️ (Cutting)
- **pressing**: 🔥 (Pressing)
- **finishing**: ✨ (Finishing)
- **kansai**: 🏭 (Kansai) ⭐ NEW

## 🔄 Migration Strategy

### Step 1: Replace Hardcoded Values
**Before:**
```javascript
const icon = machineType === 'overlock' ? '🔗' : '⚙️';
const status = item.status === 'completed' ? 'Completed' : item.status;
```

**After:**
```javascript
import { getMachineTypeIcon, getWorkStatusName } from '../constants';
const icon = getMachineTypeIcon(machineType);
const status = getWorkStatusName(item.status, currentLanguage);
```

### Step 2: Update Arrays
**Before:**
```javascript
const machineTypes = ['single-needle', 'overlock', 'flatlock', 'buttonhole'];
```

**After:**
```javascript
import { getAllMachineTypes } from '../constants/machineTypes';
const machineTypes = getAllMachineTypes().map(m => m.id);
```

### Step 3: Update Switch Statements
**Before:**
```javascript
switch (machineType) {
  case 'single-needle': return '📍';
  case 'overlock': return '🔗';
  // ... more cases
}
```

**After:**
```javascript
import { getMachineTypeIcon } from '../constants';
return getMachineTypeIcon(machineType);
```

## 🌍 Multilingual Support

All constants support both English and Nepali:

```javascript
// English (default)
getMachineTypeName('kansai'); // "Kansai"
getWorkStatusName('completed'); // "Completed"

// Nepali
getMachineTypeName('kansai', 'np'); // "कान्साई"  
getWorkStatusName('completed', 'np'); // "सम्पन्न"
```

## 📊 Benefits

1. **Consistency** - Single source of truth for all constants
2. **Maintainability** - Easy to update icons, names, colors
3. **Multilingual** - Built-in English/Nepali support
4. **Type Safety** - Centralized validation and fallbacks
5. **Performance** - Memoized lookups and calculations
6. **Developer Experience** - Auto-complete and documentation

## 🔧 Files to Update

Replace hardcoded constants in these files:
- All assignment method components
- Work management components  
- User interface components
- Data processing utilities
- Sample data files

Use the search patterns:
- `'single-needle'`, `'overlock'`, etc.
- `'pending'`, `'completed'`, etc.  
- `'admin'`, `'supervisor'`, etc.
- `'beginner'`, `'expert'`, etc.
- `'xs'`, `'small'`, `'large'`, etc.

## 🎉 Ready to Use!

The centralized constants system is now ready. Start by importing from `/src/constants` and replacing hardcoded values throughout your application!
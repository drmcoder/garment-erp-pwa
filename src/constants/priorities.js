// Priority Levels Configuration
export const PRIORITIES = {
  'low': {
    id: 'low',
    name: 'Low',
    nameNp: 'कम',
    icon: '🟢',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
    description: 'Can be done when time permits',
    level: 1,
    urgency: 'low'
  },
  'normal': {
    id: 'normal',
    name: 'Normal',
    nameNp: 'सामान्य',
    icon: '🟡',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
    description: 'Standard priority work',
    level: 2,
    urgency: 'medium'
  },
  'high': {
    id: 'high',
    name: 'High',
    nameNp: 'उच्च',
    icon: '🟠',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300',
    description: 'Important work that needs attention',
    level: 3,
    urgency: 'high'
  },
  'urgent': {
    id: 'urgent',
    name: 'Urgent',
    nameNp: 'तत्काल',
    icon: '🔴',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    description: 'Critical work requiring immediate attention',
    level: 4,
    urgency: 'critical'
  },
  'critical': {
    id: 'critical',
    name: 'Critical',
    nameNp: 'अति महत्वपूर्ण',
    icon: '🚨',
    color: 'red',
    bgColor: 'bg-red-200',
    textColor: 'text-red-900',
    borderColor: 'border-red-500',
    description: 'Emergency level priority',
    level: 5,
    urgency: 'emergency'
  }
};

// Get priority info
export const getPriority = (priorityId) => {
  return PRIORITIES[priorityId] || PRIORITIES['normal'];
};

// Get priority name
export const getPriorityName = (priorityId, language = 'en') => {
  const priority = PRIORITIES[priorityId];
  if (!priority) return priorityId || 'Normal';
  return language === 'np' ? priority.nameNp : priority.name;
};

// Get priority level (1-5, higher is more urgent)
export const getPriorityLevel = (priorityId) => {
  const priority = PRIORITIES[priorityId];
  return priority?.level || 2;
};

// Compare priorities (returns true if priority1 is higher than priority2)
export const isHigherPriority = (priority1, priority2) => {
  return getPriorityLevel(priority1) > getPriorityLevel(priority2);
};

// Get all priorities as array
export const getAllPriorities = () => {
  return Object.values(PRIORITIES).sort((a, b) => a.level - b.level);
};

// Get priority options for dropdowns
export const getPriorityOptions = (language = 'en') => {
  return Object.values(PRIORITIES).map(priority => ({
    value: priority.id,
    label: language === 'np' ? priority.nameNp : priority.name,
    icon: priority.icon,
    color: priority.color,
    level: priority.level
  })).sort((a, b) => a.level - b.level);
};

// Get priority color classes
export const getPriorityClasses = (priorityId) => {
  const priority = PRIORITIES[priorityId];
  if (!priority) return PRIORITIES['normal'];
  
  return {
    bg: priority.bgColor,
    text: priority.textColor,
    border: priority.borderColor,
    icon: priority.icon
  };
};
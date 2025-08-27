// Work Status Configuration
export const WORK_STATUSES = {
  'pending': {
    id: 'pending',
    name: 'Pending',
    nameNp: 'बाँकी',
    icon: '⏳',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300',
    description: 'Work is waiting to be started'
  },
  'ready': {
    id: 'ready',
    name: 'Ready',
    nameNp: 'तयार',
    icon: '✅',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
    description: 'Work is ready to be assigned'
  },
  'assigned': {
    id: 'assigned',
    name: 'Assigned',
    nameNp: 'असाइन गरिएको',
    icon: '👤',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    description: 'Work has been assigned to an operator'
  },
  'in-progress': {
    id: 'in-progress',
    name: 'In Progress',
    nameNp: 'प्रगतिमा',
    icon: '🔄',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
    description: 'Work is currently being done'
  },
  'completed': {
    id: 'completed',
    name: 'Completed',
    nameNp: 'सम्पन्न',
    icon: '✨',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
    description: 'Work has been completed'
  },
  'on-hold': {
    id: 'on-hold',
    name: 'On Hold',
    nameNp: 'रोकिएको',
    icon: '⏸️',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-300',
    description: 'Work is temporarily paused'
  },
  'quality-check': {
    id: 'quality-check',
    name: 'Quality Check',
    nameNp: 'गुणस्तर जाँच',
    icon: '🔍',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-300',
    description: 'Work is being quality checked'
  },
  'rejected': {
    id: 'rejected',
    name: 'Rejected',
    nameNp: 'अस्वीकार',
    icon: '❌',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    description: 'Work failed quality check'
  }
};

// Get work status info
export const getWorkStatus = (statusId) => {
  return WORK_STATUSES[statusId] || {
    id: statusId,
    name: statusId,
    nameNp: statusId,
    icon: '❓',
    color: 'gray'
  };
};

// Get work status name
export const getWorkStatusName = (statusId, language = 'en') => {
  const status = WORK_STATUSES[statusId];
  if (!status) return statusId || 'Unknown';
  return language === 'np' ? status.nameNp : status.name;
};

// Get all work statuses as array
export const getAllWorkStatuses = () => {
  return Object.values(WORK_STATUSES);
};

// Get work status options for dropdowns
export const getWorkStatusOptions = (language = 'en') => {
  return Object.values(WORK_STATUSES).map(status => ({
    value: status.id,
    label: language === 'np' ? status.nameNp : status.name,
    icon: status.icon,
    color: status.color
  }));
};
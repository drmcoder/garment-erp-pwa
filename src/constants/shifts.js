// Work Shifts Configuration - Single Shift Operation
export const SHIFTS = {
  'day': {
    id: 'day',
    name: 'Day Shift',
    nameNp: 'दिनको पारी',
    short: 'Day',
    shortNp: 'दिन',
    icon: '🏢',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    startTime: '06:00',
    endTime: '19:00',
    duration: 13,
    breakTime: 60, // minutes
    order: 1,
    isDefault: true
  }
};

// Get shift info
export const getShift = (shiftId) => {
  return SHIFTS[shiftId] || SHIFTS['day'];
};

// Get shift name
export const getShiftName = (shiftId, language = 'en', short = false) => {
  const shift = SHIFTS[shiftId];
  if (!shift) return shiftId || 'Day';
  
  if (short) {
    return language === 'np' ? shift.shortNp : shift.short;
  }
  return language === 'np' ? shift.nameNp : shift.name;
};

// Get shift time range
export const getShiftTimeRange = (shiftId) => {
  const shift = SHIFTS[shiftId];
  if (!shift) return '08:00 - 17:00';
  return `${shift.startTime} - ${shift.endTime}`;
};

// Check if current time is in shift
export const isCurrentShift = (shiftId) => {
  const shift = SHIFTS[shiftId];
  if (!shift) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour + (currentMinute / 60);
  
  const [startHour, startMin] = shift.startTime.split(':').map(Number);
  const [endHour, endMin] = shift.endTime.split(':').map(Number);
  
  let startTime = startHour + (startMin / 60);
  let endTime = endHour + (endMin / 60);
  
  // Handle overnight shifts (not needed for 6am-7pm shift)
  if (endTime <= startTime) {
    endTime += 24;
    if (currentTime < 12) {
      const adjustedCurrentTime = currentTime + 24;
      return adjustedCurrentTime >= startTime && adjustedCurrentTime < endTime;
    }
  }
  
  return currentTime >= startTime && currentTime < endTime;
};

// Get current shift
export const getCurrentShift = () => {
  const currentShiftEntry = Object.entries(SHIFTS).find(([_, shift]) => 
    isCurrentShift(shift.id)
  );
  return currentShiftEntry ? currentShiftEntry[1] : SHIFTS['day'];
};

// Get all shifts as array
export const getAllShifts = () => {
  return Object.values(SHIFTS).sort((a, b) => a.order - b.order);
};

// Get shift options for dropdowns
export const getShiftOptions = (language = 'en', short = false) => {
  return Object.values(SHIFTS).map(shift => ({
    value: shift.id,
    label: short 
      ? (language === 'np' ? shift.shortNp : shift.short)
      : (language === 'np' ? shift.nameNp : shift.name),
    icon: shift.icon,
    color: shift.color,
    timeRange: `${shift.startTime} - ${shift.endTime}`,
    order: shift.order
  })).sort((a, b) => a.order - b.order);
};
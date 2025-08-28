// Nepali Date (Bikram Sambat) Utility Functions
// Simple conversion from Gregorian (AD) to Bikram Sambat (BS)

// Approximate BS year calculation (Bikram Sambat is about 56-57 years ahead)
export const convertADtoBS = (adDate) => {
  if (!adDate) return null;
  
  const date = new Date(adDate);
  const adYear = date.getFullYear();
  const adMonth = date.getMonth() + 1; // JS months are 0-indexed
  const adDay = date.getDate();
  
  // Simple approximation: BS year is usually AD + 56 or 57
  // This is a basic conversion - for precise conversion, a proper library would be needed
  let bsYear = adYear + 56;
  
  // Adjust for month - Nepali new year starts around April 13-15
  if (adMonth < 4 || (adMonth === 4 && adDay < 13)) {
    bsYear = adYear + 56;
  } else {
    bsYear = adYear + 57;
  }
  
  // For display purposes, we'll keep the same month/day with adjusted year
  // Note: This is approximate - actual BS months have different day counts
  return {
    year: bsYear,
    month: adMonth,
    day: adDay,
    formatted: `${bsYear}/${adMonth.toString().padStart(2, '0')}/${adDay.toString().padStart(2, '0')}`
  };
};

// Format date for display in Nepali context
export const formatNepaliDate = (adDate, includeTime = false) => {
  if (!adDate) return 'N/A';
  
  const date = new Date(adDate);
  const bsDate = convertADtoBS(date);
  
  if (!bsDate) return 'N/A';
  
  const nepaliMonths = [
    'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'आश्विन',
    'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
  ];
  
  const nepaliDays = [
    'आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'
  ];
  
  const monthName = nepaliMonths[bsDate.month - 1] || bsDate.month;
  const dayName = nepaliDays[date.getDay()];
  
  let formatted = `${bsDate.year} ${monthName} ${bsDate.day}`;
  
  if (includeTime) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    formatted += ` ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }
  
  return formatted;
};

// Format date for English context  
export const formatEnglishDate = (adDate, includeTime = false) => {
  if (!adDate) return 'N/A';
  
  const date = new Date(adDate);
  
  if (includeTime) {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

// Get relative time in Nepali
export const getRelativeTimeNepali = (adDate) => {
  if (!adDate) return 'N/A';
  
  const now = new Date();
  const date = new Date(adDate);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'अहिले';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} मिनेट अगाडि`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} घण्टा अगाडि`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} दिन अगाडि`;
  } else {
    return formatNepaliDate(date);
  }
};

// Get relative time in English
export const getRelativeTimeEnglish = (adDate) => {
  if (!adDate) return 'N/A';
  
  const now = new Date();
  const date = new Date(adDate);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minutes ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hours ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} days ago`;
  } else {
    return formatEnglishDate(date);
  }
};

// Universal date formatter that chooses based on language
export const formatDateByLanguage = (adDate, isNepali, includeTime = false) => {
  return isNepali ? formatNepaliDate(adDate, includeTime) : formatEnglishDate(adDate, includeTime);
};

// Universal relative time formatter
export const getRelativeTimeByLanguage = (adDate, isNepali) => {
  return isNepali ? getRelativeTimeNepali(adDate) : getRelativeTimeEnglish(adDate);
};
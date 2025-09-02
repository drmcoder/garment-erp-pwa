// File: src/utils/nepaliDate.js
// Complete Nepali Date (Bikram Sambat) conversion and formatting system

// Nepali month names
export const NEPALI_MONTHS = {
  np: [
    'बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज',
    'कातिक', 'मंसिर', 'पौष', 'माघ', 'फागुन', 'चैत'
  ],
  en: [
    'Baisakh', 'Jestha', 'Ashar', 'Shrawan', 'Bhadra', 'Ashoj',
    'Kartik', 'Mangsir', 'Paush', 'Magh', 'Falgun', 'Chaitra'
  ]
};

// Nepali day names
export const NEPALI_DAYS = {
  np: ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};

// Nepali numerals
export const NEPALI_NUMERALS = {
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
  '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
};

// Convert AD date to BS (simplified approximation)
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
    dayOfWeek: date.getDay(),
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

// Convert numbers to Nepali numerals
export const toNepaliNumerals = (number) => {
  if (number === null || number === undefined) return '';
  return number.toString().split('').map(digit => NEPALI_NUMERALS[digit] || digit).join('');
};

// Format BS date with different options
export const formatBSDate = (adDate, format = 'full', language = 'np') => {
  if (!adDate) return language === 'np' ? 'मिति उपलब्ध छैन' : 'Date not available';
  
  const date = new Date(adDate);
  const bsDate = convertADtoBS(date);
  if (!bsDate) return 'N/A';

  const monthNames = NEPALI_MONTHS[language];
  const dayNames = NEPALI_DAYS[language];
  
  const formatNumber = (num) => {
    return language === 'np' ? toNepaliNumerals(num) : num.toString();
  };

  switch (format) {
    case 'full':
      return language === 'np' 
        ? `${dayNames[bsDate.dayOfWeek]}, ${formatNumber(bsDate.day)} ${monthNames[bsDate.month - 1]} ${formatNumber(bsDate.year)}`
        : `${dayNames[bsDate.dayOfWeek]}, ${bsDate.day} ${monthNames[bsDate.month - 1]} ${bsDate.year}`;
    
    case 'date':
      return language === 'np'
        ? `${formatNumber(bsDate.day)} ${monthNames[bsDate.month - 1]} ${formatNumber(bsDate.year)}`
        : `${bsDate.day} ${monthNames[bsDate.month - 1]} ${bsDate.year}`;
    
    case 'short':
      return language === 'np'
        ? `${formatNumber(bsDate.year)}/${formatNumber(bsDate.month)}/${formatNumber(bsDate.day)}`
        : `${bsDate.year}/${bsDate.month}/${bsDate.day}`;
    
    case 'month-year':
      return language === 'np'
        ? `${monthNames[bsDate.month - 1]} ${formatNumber(bsDate.year)}`
        : `${monthNames[bsDate.month - 1]} ${bsDate.year}`;
    
    default:
      return `${bsDate.day} ${monthNames[bsDate.month - 1]} ${bsDate.year}`;
  }
};

// Format time ago in both languages
export const formatTimeAgo = (date, language = 'np') => {
  if (!date) return '';
  
  const now = new Date();
  const inputDate = new Date(date);
  
  // Validate the input date
  if (isNaN(inputDate.getTime())) {
    return language === 'np' ? 'अमान्य मिति' : 'Invalid date';
  }
  
  const diffMs = now - inputDate;
  
  // Handle negative differences (future dates) or zero/very small differences
  if (diffMs < 0) {
    return language === 'np' ? 'भविष्यमा' : 'In the future';
  }
  
  const formatNum = (num) => {
    return language === 'np' ? toNepaliNumerals(num) : num.toString();
  };

  if (diffMs < 5000) { // Less than 5 seconds
    return language === 'np' ? 'अहिले' : 'Just now';
  } else if (diffMs < 60000) { // Less than 1 minute
    const seconds = Math.floor(diffMs / 1000);
    return language === 'np' ? `${formatNum(seconds)} सेकेन्ड पहिले` : `${seconds} seconds ago`;
  }
  
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (language === 'np') {
    if (years > 0) {
      return `${formatNum(years)} वर्ष अगाडी`;
    } else if (months > 0) {
      return `${formatNum(months)} महिना अगाडी`;
    } else if (days > 0) {
      return `${formatNum(days)} दिन अगाडी`;
    } else if (hours > 0) {
      return `${formatNum(hours)} घन्टा अगाडी`;
    } else {
      return `${formatNum(minutes)} मिनेट अगाडी`;
    }
  } else {
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} ago`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    } else {
      return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    }
  }
};

// Get current BS date
export const getCurrentBSDate = (format = 'full', language = 'np') => {
  return formatBSDate(new Date(), format, language);
};

// Get BS fiscal year (starts from Shrawan - month 4)
export const getBSFiscalYear = (date = new Date()) => {
  const bsDate = convertADtoBS(date);
  if (!bsDate) return null;
  
  // Fiscal year starts from Shrawan (month 4 in BS calendar)
  if (bsDate.month >= 4) {
    return {
      year: bsDate.year,
      display: `${bsDate.year}/${(bsDate.year + 1).toString().slice(-2)}`
    };
  } else {
    return {
      year: bsDate.year - 1,
      display: `${bsDate.year - 1}/${bsDate.year.toString().slice(-2)}`
    };
  }
};

const nepaliDateUtils = {
  convertADtoBS,
  formatBSDate,
  formatTimeAgo,
  getCurrentBSDate,
  getBSFiscalYear,
  toNepaliNumerals,
  NEPALI_MONTHS,
  NEPALI_DAYS,
  NEPALI_NUMERALS
};

export default nepaliDateUtils;

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
// src/components/common/NepaliDatePicker.jsx
// Reusable Nepali Date Picker Component with Bikram Sambat Calendar

import React, { useState, useEffect } from 'react';
import { NepaliDatePicker } from 'nepali-datepicker-reactjs';
import { useLanguage } from '../../context/LanguageContext';
import 'nepali-datepicker-reactjs/dist/index.css';

const CustomNepaliDatePicker = ({ 
  value, 
  onChange, 
  placeholder, 
  disabled = false,
  className = '',
  label,
  error,
  required = false,
  ...props 
}) => {
  const { currentLanguage } = useLanguage();
  const isNepali = currentLanguage === 'np';
  
  const [selectedDate, setSelectedDate] = useState(value || '');

  useEffect(() => {
    setSelectedDate(value || '');
  }, [value]);

  const handleDateChange = (dateValue) => {
    setSelectedDate(dateValue);
    if (onChange) {
      onChange(dateValue);
    }
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    return isNepali ? 'मिति छनोट गर्नुहोस्' : 'Select Date';
  };

  const getLabel = () => {
    if (label) return label;
    return isNepali ? 'मिति' : 'Date';
  };

  return (
    <div className={`nepali-datepicker-wrapper ${className}`}>
      {(label || getLabel()) && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {getLabel()}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <NepaliDatePicker
          inputClassName={`
            w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
          `}
          value={selectedDate}
          onChange={handleDateChange}
          placeholder={getPlaceholder()}
          disabled={disabled}
          options={{
            calType: 'nepali', // Use Bikram Sambat calendar
            theme: 'default',
            language: isNepali ? 'nepali' : 'english',
            minYear: 2070, // BS year
            maxYear: 2090, // BS year
            format: 'YYYY-MM-DD', // Nepali date format
            closeOnDateSelect: true,
          }}
          {...props}
        />
        
        {/* Calendar icon */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {/* Help text */}
      <p className="mt-1 text-xs text-gray-500">
        {isNepali 
          ? 'बिक्रम संबत मिति (जस्तै: २०८१-०४-१५)'
          : 'Bikram Sambat Date (e.g., 2081-04-15)'
        }
      </p>
    </div>
  );
};

// Utility functions for date conversion and formatting
export const NepaliDateUtils = {
  // Format Nepali date for display
  formatNepaliDate: (dateString, format = 'YYYY-MM-DD') => {
    if (!dateString) return '';
    // The library should handle formatting
    return dateString;
  },

  // Get current Nepali date
  getCurrentNepaliDate: () => {
    // This would typically use the library's current date function
    const today = new Date();
    // Convert to Nepali date using the library
    return today.toISOString().split('T')[0]; // Placeholder
  },

  // Validate Nepali date
  isValidNepaliDate: (dateString) => {
    if (!dateString) return false;
    // Basic validation - the library should handle this
    const parts = dateString.split('-');
    return parts.length === 3 && parts.every(part => !isNaN(part));
  },

  // Convert Nepali date to English date (Gregorian)
  nepaliToEnglish: (nepaliDate) => {
    // This would use the library's conversion function
    return nepaliDate; // Placeholder - implement with library
  },

  // Convert English date to Nepali date
  englishToNepali: (englishDate) => {
    // This would use the library's conversion function  
    return englishDate; // Placeholder - implement with library
  }
};

// Date range picker component
export const NepaliDateRangePicker = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  className = '',
  ...props 
}) => {
  const { currentLanguage } = useLanguage();
  const isNepali = currentLanguage === 'np';

  return (
    <div className={`nepali-daterange-picker ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <CustomNepaliDatePicker
            label={isNepali ? 'सुरु मिति' : 'Start Date'}
            value={startDate}
            onChange={onStartDateChange}
            placeholder={isNepali ? 'सुरु मिति छनोट गर्नुहोस्' : 'Select start date'}
            {...props}
          />
        </div>
        <div className="flex-1">
          <CustomNepaliDatePicker
            label={isNepali ? 'अन्त्य मिति' : 'End Date'}
            value={endDate}
            onChange={onEndDateChange}
            placeholder={isNepali ? 'अन्त्य मिति छनोट गर्नुहोस्' : 'Select end date'}
            {...props}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomNepaliDatePicker;
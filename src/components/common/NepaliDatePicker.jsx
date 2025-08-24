import React, { useState, useEffect, useMemo } from 'react';
import { NepaliDatePicker } from 'nepali-datepicker-reactjs';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from './GlobalErrorHandler';
import 'nepali-datepicker-reactjs/dist/index.css';

// Clean wrapper for external library to avoid warnings
const SafeNepaliDatePicker = React.memo((props) => {
  return <NepaliDatePicker {...props} />;
});

const CustomNepaliDatePicker = ({ 
  value, 
  onChange, 
  placeholder = '',
  className = '',
  required = false,
  disabled = false,
  label = '',
  showTodayButton = true,
  ...props 
}) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  const [internalValue, setInternalValue] = useState(value || '');

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  const handleDateChange = (selectedDate) => {
    try {
      // The nepali-datepicker-reactjs returns BS date in YYYY-MM-DD format
      if (selectedDate) {
        const formattedDate = formatNepaliDate(selectedDate);
        setInternalValue(formattedDate);
        if (onChange) {
          onChange(formattedDate);
        }
      }
    } catch (error) {
      addError({
        message: 'Error selecting Nepali date',
        component: 'NepaliDatePicker',
        action: 'Date Selection',
        data: { selectedDate, error: error.message }
      }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
    }
  };

  const formatNepaliDate = (dateString) => {
    try {
      // Convert from YYYY-MM-DD to YYYY/MM/DD format for consistency
      if (dateString && dateString.includes('-')) {
        return dateString.replace(/-/g, '/');
      }
      return dateString;
    } catch (error) {
      addError({
        message: 'Error formatting Nepali date',
        component: 'NepaliDatePicker',
        action: 'Date Formatting',
        data: { dateString, error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.LOW);
      return dateString;
    }
  };

  const parseNepaliDate = (dateString) => {
    try {
      // Convert from YYYY/MM/DD to YYYY-MM-DD format for the picker
      if (dateString && dateString.includes('/')) {
        return dateString.replace(/\//g, '-');
      }
      return dateString;
    } catch (error) {
      addError({
        message: 'Error parsing Nepali date',
        component: 'NepaliDatePicker',
        action: 'Date Parsing',
        data: { dateString, error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.LOW);
      return dateString;
    }
  };

  const setToday = () => {
    try {
      const today = new Date();
      const nepaliYear = today.getFullYear() + 57; // Approximate conversion
      const nepaliMonth = ((today.getMonth() + 8) % 12) + 1; // Approximate conversion
      const nepaliDay = today.getDate();
      
      const todayNepali = `${nepaliYear}/${nepaliMonth.toString().padStart(2, '0')}/${nepaliDay.toString().padStart(2, '0')}`;
      setInternalValue(todayNepali);
      if (onChange) {
        onChange(todayNepali);
      }
    } catch (error) {
      addError({
        message: 'Error setting today\'s Nepali date',
        component: 'NepaliDatePicker',
        action: 'Set Today',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.MEDIUM);
    }
  };

  return (
    <div className="nepali-date-picker-wrapper">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <SafeNepaliDatePicker
          inputClassName={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
          value={parseNepaliDate(internalValue)}
          onChange={handleDateChange}
          options={{
            calenderLocale: currentLanguage === 'np' ? 'ne' : 'en',
            valueLocale: currentLanguage === 'np' ? 'ne' : 'en',
            placeholder: placeholder || (currentLanguage === 'np' ? 'मिति छान्नुहोस्' : 'Select Date'),
            closeOnDateSelect: true,
            disableBefore: false,
            disableAfter: false
          }}
          disabled={disabled}
          {...props}
        />
        
        {/* Calendar icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {showTodayButton && (
        <div className="mt-2">
          <button
            type="button"
            onClick={setToday}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {currentLanguage === 'np' ? 'आजको मिति प्रयोग गर्नुहोस्' : 'Use Today\'s Date'}
          </button>
        </div>
      )}

      {/* Display current value in both formats for clarity */}
      {internalValue && (
        <div className="mt-1">
          <p className="text-xs text-gray-500">
            {currentLanguage === 'np' ? 'चयनित मिति:' : 'Selected Date:'} {internalValue}
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomNepaliDatePicker;
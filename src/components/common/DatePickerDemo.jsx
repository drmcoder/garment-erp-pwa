// src/components/common/DatePickerDemo.jsx
// Demo component to showcase Nepali Date Picker functionality

import React, { useState } from 'react';
import CustomNepaliDatePicker, { NepaliDateRangePicker, NepaliDateUtils } from './NepaliDatePicker';
import { useLanguage } from '../../context/LanguageContext';

const DatePickerDemo = () => {
  const { currentLanguage } = useLanguage();
  const isNepali = currentLanguage === 'np';
  
  const [selectedDate, setSelectedDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [joinDate, setJoinDate] = useState('');

  const handleDateChange = (date) => {
    setSelectedDate(date);
    console.log('Selected date:', date);
  };

  const handleReset = () => {
    setSelectedDate('');
    setStartDate('');
    setEndDate('');
    setBirthDate('');
    setJoinDate('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isNepali ? 'नेपाली मिति छानक' : 'Nepali Date Picker Demo'}
        </h1>
        <p className="text-gray-600">
          {isNepali 
            ? 'बिक्रम संबत क्यालेन्डर प्रयोग गरेर मिति छान्नुहोस्'
            : 'Select dates using the Bikram Sambat calendar system'
          }
        </p>
      </div>

      {/* Basic Date Picker */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {isNepali ? 'साधारण मिति छानक' : 'Basic Date Picker'}
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <CustomNepaliDatePicker
              label={isNepali ? 'मिति छनोट गर्नुहोस्' : 'Select Date'}
              value={selectedDate}
              onChange={handleDateChange}
              placeholder={isNepali ? 'मिति छनोट गर्नुहोस्' : 'Choose a date'}
              required
            />
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">
              {isNepali ? 'छानिएको मिति:' : 'Selected Date:'}
            </h3>
            <p className="text-lg font-mono text-blue-600">
              {selectedDate || (isNepali ? 'कुनै मिति छानिएको छैन' : 'No date selected')}
            </p>
          </div>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {isNepali ? 'मिति दायरा छानक' : 'Date Range Picker'}
        </h2>
        
        <NepaliDateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
        
        <div className="mt-4 bg-gray-50 p-4 rounded">
          <h3 className="font-medium mb-2">
            {isNepali ? 'छानिएको दायरा:' : 'Selected Range:'}
          </h3>
          <div className="space-y-1 font-mono text-sm">
            <p>
              <span className="font-medium">
                {isNepali ? 'सुरु:' : 'Start:'}
              </span> {startDate || (isNepali ? 'छानिएको छैन' : 'Not selected')}
            </p>
            <p>
              <span className="font-medium">
                {isNepali ? 'अन्त्य:' : 'End:'}
              </span> {endDate || (isNepali ? 'छानिएको छैन' : 'Not selected')}
            </p>
          </div>
        </div>
      </div>

      {/* Form Example */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {isNepali ? 'कर्मचारी फारम उदाहरण' : 'Employee Form Example'}
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <CustomNepaliDatePicker
            label={isNepali ? 'जन्म मिति' : 'Birth Date'}
            value={birthDate}
            onChange={setBirthDate}
            placeholder={isNepali ? 'जन्म मिति छनोट गर्नुहोस्' : 'Select birth date'}
            required
          />
          
          <CustomNepaliDatePicker
            label={isNepali ? 'कामकाज सुरु मिति' : 'Joining Date'}
            value={joinDate}
            onChange={setJoinDate}
            placeholder={isNepali ? 'कामकाज सुरु मिति छनोट गर्नुहोस्' : 'Select joining date'}
            required
          />
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h3 className="font-medium mb-2 text-blue-800">
            {isNepali ? 'फारम डाटा:' : 'Form Data:'}
          </h3>
          <div className="space-y-1 text-sm text-blue-700 font-mono">
            <p>
              {isNepali ? 'जन्म मिति:' : 'Birth Date:'} {birthDate || 'N/A'}
            </p>
            <p>
              {isNepali ? 'कामकाज सुरु:' : 'Joining Date:'} {joinDate || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {isNepali ? 'रिसेट गर्नुहोस्' : 'Reset All'}
        </button>
        
        <button
          onClick={() => {
            const today = NepaliDateUtils.getCurrentNepaliDate();
            setSelectedDate(today);
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isNepali ? 'आजको मिति' : 'Today\'s Date'}
        </button>
        
        <button
          onClick={() => {
            alert(`Selected: ${selectedDate}\nStart: ${startDate}\nEnd: ${endDate}`);
          }}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          {isNepali ? 'मिति देखाउनुहोस्' : 'Show Dates'}
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r">
        <h3 className="font-medium text-yellow-800 mb-2">
          {isNepali ? 'निर्देशनहरू:' : 'Instructions:'}
        </h3>
        <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
          <li>
            {isNepali 
              ? 'मिति छान्नको लागि इनपुट फिल्डमा क्लिक गर्नुहोस्'
              : 'Click on the input field to open the date picker'
            }
          </li>
          <li>
            {isNepali 
              ? 'बिक्रम संबत क्यालेन्डरमा मिति छान्नुहोस्'
              : 'Select dates using the Bikram Sambat calendar'
            }
          </li>
          <li>
            {isNepali 
              ? 'भाषा बदल्न माथिको भाषा टगल प्रयोग गर्नुहोस्'
              : 'Use the language toggle above to switch between Nepali and English'
            }
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DatePickerDemo;
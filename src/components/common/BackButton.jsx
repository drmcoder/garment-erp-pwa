import React from 'react';
import { ChevronLeft } from 'lucide-react';

const BackButton = ({ onClick, text = 'Back', className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${className}`}
    >
      <ChevronLeft className="w-4 h-4 mr-2" />
      {text}
    </button>
  );
};

export default BackButton;
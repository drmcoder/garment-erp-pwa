import React from 'react';
import { WORK_STATUS_CONFIG, PRIORITY_CONFIG } from '../../constants';

const StatusBadge = ({ 
  status, 
  type = 'work', // 'work' | 'priority' | 'custom'
  size = 'md',
  showIcon = true,
  className = '' 
}) => {
  const getStatusConfig = () => {
    switch (type) {
      case 'work':
        return WORK_STATUS_CONFIG[status] || {};
      case 'priority':
        return PRIORITY_CONFIG[status] || {};
      default:
        return {};
    }
  };

  const config = getStatusConfig();
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  };

  const badgeClasses = `
    inline-flex items-center
    font-medium rounded-full
    ${sizeClasses[size]}
    ${config.bgColor || 'bg-gray-100'}
    ${config.textColor || 'text-gray-800'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <span className={badgeClasses}>
      {showIcon && config.icon && (
        <span className="mr-1">{config.icon}</span>
      )}
      {config.label || status}
    </span>
  );
};

export default StatusBadge;
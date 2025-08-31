import React from 'react';
import UniqueAvatarSystem from '../avatar/UniqueAvatarSystem';

const OperatorAvatar = ({ 
  operator, 
  size = 'md', 
  showStatus = false, 
  showWorkload = false,
  showBadges = false,
  onClick = null,
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm', 
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl'
  };

  const statusColors = {
    available: 'bg-green-500',
    busy: 'bg-yellow-500',
    offline: 'bg-gray-500',
    break: 'bg-blue-500'
  };

  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderAvatar = () => {
    const { avatar } = operator;
    const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold ${className}`;
    
    switch (avatar?.type) {
      case 'emoji':
        return (
          <div 
            className={`${baseClasses}`}
            style={{ backgroundColor: avatar.bgColor, color: avatar.textColor }}
          >
            <span className="text-lg">{avatar.value}</span>
          </div>
        );
      
      case 'photo':
        return (
          <img 
            src={avatar.value} 
            alt={operator.name}
            className={`${baseClasses} object-cover`}
          />
        );
      
      case 'initials':
        return (
          <div 
            className={`${baseClasses}`}
            style={{ 
              backgroundColor: avatar?.bgColor || operator.profileColor || '#6B7280',
              color: avatar?.textColor || '#FFFFFF'
            }}
          >
            <span>{avatar?.value || getInitials(operator.name)}</span>
          </div>
        );

      case 'unique':
      default:
        // Use UniqueAvatarSystem for unique identity avatars
        return (
          <div className={baseClasses}>
            <UniqueAvatarSystem
              userId={operator.id || operator.username}
              name={operator.name || operator.nameEn || operator.username}
              size={size}
              className="w-full h-full"
            />
          </div>
        );
    }
  };

  return (
    <div className="relative inline-block">
      <div 
        className={`relative ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={onClick}
      >
        {renderAvatar()}
        
        {/* Status indicator */}
        {showStatus && operator.status && (
          <div 
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusColors[operator.status]}`}
            title={`Status: ${operator.status}`}
          />
        )}
        
        {/* Workload indicator */}
        {showWorkload && operator.currentWorkload > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {operator.currentWorkload}
          </div>
        )}
      </div>
      
      {/* Visual badges */}
      {showBadges && operator.visualBadges && operator.visualBadges.length > 0 && (
        <div className="flex space-x-1 mt-1 justify-center">
          {operator.visualBadges.slice(0, 3).map((badge, index) => (
            <span key={index} className="text-xs" title="Achievement badge">
              {badge}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default OperatorAvatar;
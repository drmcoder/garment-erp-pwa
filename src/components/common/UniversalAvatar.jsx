// src/components/common/UniversalAvatar.jsx
// Universal avatar component that works with any user type

import React from 'react';
import OperatorAvatar from './OperatorAvatar';

const UniversalAvatar = ({
  user,
  size = 'md',
  showStatus = false,
  showWorkload = false,
  showBadges = false,
  onClick = null,
  className = '',
  style = 'unique' // 'unique', 'initials', 'emoji'
}) => {
  // Normalize user data to work with OperatorAvatar
  const normalizedUser = {
    id: user?.id || user?.uid || user?.userId,
    name: user?.name || user?.displayName || user?.username || 'User',
    status: user?.status || 'available',
    currentWorkload: user?.currentWorkload || user?.workload || 0,
    maxWorkload: user?.maxWorkload || 3,
    machineType: user?.machineType || user?.machine || user?.speciality,
    avatar: {
      type: style,
      bgColor: user?.profileColor || '#4F46E5',
      textColor: '#FFFFFF',
      ...user?.avatar
    },
    visualBadges: user?.visualBadges || []
  };

  return (
    <OperatorAvatar
      operator={normalizedUser}
      size={size}
      showStatus={showStatus}
      showWorkload={showWorkload}
      showBadges={showBadges}
      onClick={onClick}
      className={className}
    />
  );
};

export default UniversalAvatar;
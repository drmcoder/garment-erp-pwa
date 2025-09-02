// src/components/common/DamageNotificationSystem.jsx
// Real-time notification system for damage reporting workflow

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationContext } from '../../context/NotificationContext';
import { Bell, CheckCircle, AlertTriangle, X, Package } from 'lucide-react';

const DamageNotificationSystem = () => {
  const { user } = useContext(AuthContext);
  const { isNepali } = useContext(LanguageContext);
  const { notifications, clearNotification } = useContext(NotificationContext);

  const [damageNotifications, setDamageNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Filter damage-related notifications
    const damageNotifs = notifications?.filter(notif => 
      notif.type === 'damage_reported' || 
      notif.type === 'rework_completed' ||
      notif.type === 'rework_started'
    ) || [];
    
    setDamageNotifications(damageNotifs);
  }, [notifications]);

  const handleNotificationClick = (notification) => {
    // Mark as read and handle action based on type
    if (notification.type === 'damage_reported' && user.role === 'supervisor') {
      // Navigate to damage queue
      window.location.hash = '#damage-queue';
    } else if (notification.type === 'rework_completed' && user.role === 'operator') {
      // Show bundle updated notification
      console.log('Rework completed for bundle:', notification.data.bundleNumber);
    }
    
    // Clear the notification
    clearNotification?.(notification.id);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'damage_reported':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'rework_started':
        return <Package className="text-yellow-500" size={20} />;
      case 'rework_completed':
        return <CheckCircle className="text-green-500" size={20} />;
      default:
        return <Bell className="text-blue-500" size={20} />;
    }
  };

  const getNotificationMessage = (notification) => {
    const { type, data } = notification;
    
    if (isNepali) {
      switch (type) {
        case 'damage_reported':
          return `${data.operatorName} ले ${data.bundleNumber} मा ${data.pieceCount} टुक्रा क्षतिको रिपोर्ट गर्यो`;
        case 'rework_started':
          return `${data.supervisorName} ले ${data.bundleNumber} को मर्मत सुरु गर्यो`;
        case 'rework_completed':
          return `${data.supervisorName} ले ${data.bundleNumber} को ${data.pieceCount} टुक्रा ठीक गरे`;
        default:
          return notification.message;
      }
    } else {
      switch (type) {
        case 'damage_reported':
          return `${data.operatorName} reported ${data.pieceCount} damaged pieces in ${data.bundleNumber}`;
        case 'rework_started':
          return `${data.supervisorName} started rework on ${data.bundleNumber}`;
        case 'rework_completed':
          return `${data.supervisorName} completed rework of ${data.pieceCount} pieces in ${data.bundleNumber}`;
        default:
          return notification.message;
      }
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'damage_reported':
        return 'border-l-red-500 bg-red-50';
      case 'rework_started':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'rework_completed':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const unreadCount = damageNotifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">
                🔧 {isNepali ? 'क्षति र मर्मत सूचना' : 'Damage & Rework Notifications'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {damageNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {isNepali ? 'कुनै नयाँ सूचना छैन' : 'No new notifications'}
                </p>
              </div>
            ) : (
              damageNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-l-4 ${getNotificationColor(notification.type)} hover:bg-opacity-75 cursor-pointer transition-colors`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {getNotificationMessage(notification)}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                        {notification.data?.urgency === 'urgent' && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            {isNepali ? 'जरुरी' : 'Urgent'}
                          </span>
                        )}
                      </div>
                      
                      {/* Action buttons for specific notification types */}
                      {notification.type === 'damage_reported' && user.role === 'supervisor' && (
                        <div className="mt-2">
                          <button
                            className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to damage queue
                              window.location.hash = '#damage-queue';
                              setIsOpen(false);
                            }}
                          >
                            {isNepali ? 'मर्मत सुरु गर्नुहोस्' : 'Start Rework'}
                          </button>
                        </div>
                      )}
                      
                      {notification.type === 'rework_completed' && user.role === 'operator' && (
                        <div className="mt-2">
                          <button
                            className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to work dashboard
                              window.location.hash = '#work-dashboard';
                              setIsOpen(false);
                            }}
                          >
                            {isNepali ? 'काम जारी राख्नुहोस्' : 'Continue Work'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {damageNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  // Clear all damage notifications
                  damageNotifications.forEach(notif => clearNotification?.(notif.id));
                  setIsOpen(false);
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                {isNepali ? 'सबै मेट्नुहोस्' : 'Clear all'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// Live notification banner for urgent damage reports
export const DamageNotificationBanner = ({ notification, onDismiss }) => {
  const { isNepali } = useContext(LanguageContext);
  
  if (!notification || notification.type !== 'damage_reported' || notification.urgency !== 'urgent') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-start space-x-3">
        <AlertTriangle size={24} className="mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm">
            🚨 {isNepali ? 'जरुरी क्षति रिपोर्ट!' : 'Urgent Damage Report!'}
          </h4>
          <p className="text-sm mt-1">
            {notification.data?.operatorName} - {notification.data?.bundleNumber}
          </p>
          <p className="text-xs mt-1 opacity-90">
            {notification.data?.damageType.replace('_', ' ')} • {notification.data?.pieceCount} pieces
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-white hover:text-gray-200 flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="mt-3 flex space-x-2">
        <button
          onClick={() => {
            window.location.hash = '#damage-queue';
            onDismiss();
          }}
          className="bg-white text-red-500 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100"
        >
          {isNepali ? 'तुरुन्त हेर्नुहोस्' : 'View Now'}
        </button>
        <button
          onClick={onDismiss}
          className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700"
        >
          {isNepali ? 'बन्द गर्नुहोस्' : 'Dismiss'}
        </button>
      </div>
    </div>
  );
};

export default DamageNotificationSystem;
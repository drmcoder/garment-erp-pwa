// netlify/functions/notifications.mts
// Push notifications & real-time alerts system

import type { Context, Config } from "@netlify/functions";

interface Notification {
  id: string;
  userId: string;
  type: 'work_assignment' | 'quality_issue' | 'efficiency_alert' | 'target_achieved' | 'break_reminder' | 'work_available' | 'system_message';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
}

interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: string;
}

// Mock notification database
let notifications: Notification[] = [
  {
    id: 'notif_001',
    userId: 'op_001',
    type: 'work_assignment',
    title: '🔔 नयाँ काम',
    message: 'लेख 8085 - काँध जोड्ने तपाईंलाई तोकिएको छ',
    data: { bundleId: 'bundle_001', articleNumber: '8085', operation: 'काँध जोड्ने' },
    read: false,
    priority: 'normal',
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'notif_002',
    userId: 'op_001',
    type: 'target_achieved',
    title: '🎯 लक्ष्य प्राप्त',
    message: 'दैनिक उत्पादन लक्ष्य 85% पूरा भयो!',
    data: { targetType: 'daily_production', percentage: 85 },
    read: true,
    priority: 'normal',
    readAt: new Date(Date.now() - 900000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

// Mock push subscriptions
let pushSubscriptions: PushSubscription[] = [];

// Verify JWT token
const verifyToken = (token: string): any => {
  try {
    const [header, payload, signature] = token.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
    
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return decodedPayload;
  } catch (error) {
    return null;
  }
};

// Send push notification to specific user
const sendPushNotification = async (userId: string, notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>): Promise<boolean> => {
  const userSubscriptions = pushSubscriptions.filter(sub => sub.userId === userId);
  
  if (userSubscriptions.length === 0) {
    console.log(`No push subscriptions found for user ${userId}`);
    return false;
  }

  // In production, you would use a service like Firebase Cloud Messaging or Web Push
  // For now, we'll simulate the push notification
  console.log(`Sending push notification to ${userSubscriptions.length} devices for user ${userId}`);
  console.log('Notification:', notification);

  // Simulate successful push delivery
  return true;
};

// Generate notification templates
const createNotificationTemplate = (type: string, data: any, language = 'np'): Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'> => {
  const templates: Record<string, any> = {
    work_assignment: {
      np: {
        title: '🔔 नयाँ काम',
        message: `लेख ${data.articleNumber} - ${data.operation} तपाईंलाई तोकिएको छ`,
        priority: 'normal'
      },
      en: {
        title: '🔔 New Work',
        message: `Article ${data.articleNumber} - ${data.operation} assigned to you`,
        priority: 'normal'
      }
    },
    work_completed: {
      np: {
        title: '✅ काम सम्पन्न',
        message: `लेख ${data.articleNumber} सम्पन्न! कमाई: रु. ${data.earnings}`,
        priority: 'normal'
      },
      en: {
        title: '✅ Work Completed',
        message: `Article ${data.articleNumber} completed! Earnings: Rs. ${data.earnings}`,
        priority: 'normal'
      }
    },
    quality_issue: {
      np: {
        title: '🚨 गुणस्तर समस्या',
        message: `बन्डल ${data.bundleId} मा ${data.defectType} फेला परेको`,
        priority: 'high'
      },
      en: {
        title: '🚨 Quality Issue',
        message: `${data.defectType} found in bundle ${data.bundleId}`,
        priority: 'high'
      }
    },
    efficiency_alert: {
      np: {
        title: '⚡ दक्षता अलर्ट',
        message: `${data.stationName} ${data.idleTime} मिनेट देखि खाली छ`,
        priority: 'high'
      },
      en: {
        title: '⚡ Efficiency Alert',
        message: `${data.stationName} idle for ${data.idleTime} minutes`,
        priority: 'high'
      }
    },
    target_achieved: {
      np: {
        title: '🎯 लक्ष्य प्राप्त',
        message: `${data.targetType} लक्ष्य ${data.percentage}% पूरा भयो!`,
        priority: 'normal'
      },
      en: {
        title: '🎯 Target Achieved',
        message: `${data.targetType} target ${data.percentage}% achieved!`,
        priority: 'normal'
      }
    },
    break_reminder: {
      np: {
        title: '⏰ विश्राम सम्झना',
        message: `विश्राम समय ${data.timeRemaining} मिनेटमा सुरु हुन्छ`,
        priority: 'low'
      },
      en: {
        title: '⏰ Break Reminder',
        message: `Break time starts in ${data.timeRemaining} minutes`,
        priority: 'low'
      }
    },
    work_available: {
      np: {
        title: '📋 नयाँ काम उपलब्ध',
        message: `तपाईंका लागि ${data.workCount} नयाँ काम उपलब्ध छ`,
        priority: 'normal'
      },
      en: {
        title: '📋 New Work Available',
        message: `${data.workCount} new work items available for you`,
        priority: 'normal'
      }
    },
    system_message: {
      np: {
        title: '📢 सिस्टम सन्देश',
        message: data.message || 'सिस्टम अपडेट',
        priority: data.priority || 'normal'
      },
      en: {
        title: '📢 System Message',
        message: data.message || 'System update',
        priority: data.priority || 'normal'
      }
    }
  };

  const template = templates[type]?.[language] || templates[type]?.['np'];
  
  return {
    type: type as any,
    title: template.title,
    message: template.message,
    data,
    priority: template.priority
  };
};

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const method = req.method;

  // Handle CORS
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    let userPayload = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      userPayload = verifyToken(token);
      
      if (!userPayload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid or expired token'
        }), {
          status: 401,
          headers
        });
      }
    }

    // Get notifications for user
    if (method === 'GET' && url.pathname.endsWith('/notifications')) {
      if (!userPayload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), {
          status: 401,
          headers
        });
      }

      const searchParams = url.searchParams;
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');
      const unreadOnly = searchParams.get('unreadOnly') === 'true';

      let userNotifications = notifications.filter(n => n.userId === userPayload.sub);

      if (unreadOnly) {
        userNotifications = userNotifications.filter(n => !n.read);
      }

      // Sort by creation date (newest first)
      userNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply pagination
      const paginatedNotifications = userNotifications.slice(offset, offset + limit);

      return new Response(JSON.stringify({
        success: true,
        notifications: paginatedNotifications,
        total: userNotifications.length,
        unreadCount: notifications.filter(n => n.userId === userPayload.sub && !n.read).length
      }), {
        status: 200,
        headers
      });
    }

    // Send notification to user(s)
    if (method === 'POST' && url.pathname.endsWith('/notifications/send')) {
      if (!userPayload || !['supervisor', 'manager'].includes(userPayload.role)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient permissions'
        }), {
          status: 403,
          headers
        });
      }

      const body = await req.json();
      const { 
        userIds, 
        type, 
        data, 
        language = 'np', 
        customTitle, 
        customMessage, 
        priority = 'normal',
        sendPush = true 
      } = body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User IDs required'
        }), {
          status: 400,
          headers
        });
      }

      const sentNotifications: Notification[] = [];

      for (const userId of userIds) {
        // Create notification template or use custom content
        let notificationContent;
        
        if (customTitle && customMessage) {
          notificationContent = {
            type: type || 'system_message',
            title: customTitle,
            message: customMessage,
            data: data || {},
            priority
          };
        } else if (type && data) {
          notificationContent = createNotificationTemplate(type, data, language);
        } else {
          continue; // Skip if insufficient data
        }

        // Create notification record
        const notification: Notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          ...notificationContent,
          read: false,
          createdAt: new Date().toISOString()
        };

        notifications.push(notification);
        sentNotifications.push(notification);

        // Send push notification if enabled
        if (sendPush) {
          await sendPushNotification(userId, notificationContent);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        sentNotifications,
        count: sentNotifications.length
      }), {
        status: 200,
        headers
      });
    }

    // Mark notification as read
    if (method === 'PUT' && url.pathname.includes('/notifications/') && url.pathname.endsWith('/read')) {
      if (!userPayload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), {
          status: 401,
          headers
        });
      }

      const notificationId = url.pathname.split('/notifications/')[1].replace('/read', '');
      const notificationIndex = notifications.findIndex(n => 
        n.id === notificationId && n.userId === userPayload.sub
      );

      if (notificationIndex === -1) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Notification not found'
        }), {
          status: 404,
          headers
        });
      }

      notifications[notificationIndex] = {
        ...notifications[notificationIndex],
        read: true,
        readAt: new Date().toISOString()
      };

      return new Response(JSON.stringify({
        success: true,
        notification: notifications[notificationIndex]
      }), {
        status: 200,
        headers
      });
    }

    // Mark all notifications as read
    if (method === 'PUT' && url.pathname.endsWith('/notifications/read-all')) {
      if (!userPayload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), {
          status: 401,
          headers
        });
      }

      const readTime = new Date().toISOString();
      let updatedCount = 0;

      notifications = notifications.map(notification => {
        if (notification.userId === userPayload.sub && !notification.read) {
          updatedCount++;
          return {
            ...notification,
            read: true,
            readAt: readTime
          };
        }
        return notification;
      });

      return new Response(JSON.stringify({
        success: true,
        updatedCount
      }), {
        status: 200,
        headers
      });
    }

    // Delete notification
    if (method === 'DELETE' && url.pathname.includes('/notifications/')) {
      if (!userPayload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), {
          status: 401,
          headers
        });
      }

      const notificationId = url.pathname.split('/notifications/')[1];
      const notificationIndex = notifications.findIndex(n => 
        n.id === notificationId && n.userId === userPayload.sub
      );

      if (notificationIndex === -1) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Notification not found'
        }), {
          status: 404,
          headers
        });
      }

      notifications.splice(notificationIndex, 1);

      return new Response(JSON.stringify({
        success: true,
        message: 'Notification deleted'
      }), {
        status: 200,
        headers
      });
    }

    // Subscribe to push notifications
    if (method === 'POST' && url.pathname.endsWith('/notifications/subscribe')) {
      if (!userPayload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), {
          status: 401,
          headers
        });
      }

      const body = await req.json();
      const { endpoint, keys } = body;

      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid subscription data'
        }), {
          status: 400,
          headers
        });
      }

      // Remove existing subscription for this user
      pushSubscriptions = pushSubscriptions.filter(sub => sub.userId !== userPayload.sub);

      // Add new subscription
      const subscription: PushSubscription = {
        userId: userPayload.sub,
        endpoint,
        keys,
        userAgent: req.headers.get('User-Agent') || '',
        createdAt: new Date().toISOString()
      };

      pushSubscriptions.push(subscription);

      return new Response(JSON.stringify({
        success: true,
        message: 'Push notification subscription created'
      }), {
        status: 200,
        headers
      });
    }

    // Unsubscribe from push notifications
    if (method === 'DELETE' && url.pathname.endsWith('/notifications/subscribe')) {
      if (!userPayload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), {
          status: 401,
          headers
        });
      }

      const removedCount = pushSubscriptions.length;
      pushSubscriptions = pushSubscriptions.filter(sub => sub.userId !== userPayload.sub);

      return new Response(JSON.stringify({
        success: true,
        message: 'Push notification subscription removed',
        removedCount: removedCount - pushSubscriptions.length
      }), {
        status: 200,
        headers
      });
    }

    // Send bulk notification templates (for common scenarios)
    if (method === 'POST' && url.pathname.endsWith('/notifications/bulk-send')) {
      if (!userPayload || !['supervisor', 'manager'].includes(userPayload.role)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient permissions'
        }), {
          status: 403,
          headers
        });
      }

      const body = await req.json();
      const { scenario, data } = body;

      let targetUsers: string[] = [];
      let notificationType = '';
      let notificationData = {};

      switch (scenario) {
        case 'work_assigned':
          targetUsers = [data.operatorId];
          notificationType = 'work_assignment';
          notificationData = {
            bundleId: data.bundleId,
            articleNumber: data.articleNumber,
            operation: data.operation
          };
          break;

        case 'shift_start_reminder':
          targetUsers = data.operatorIds || [];
          notificationType = 'system_message';
          notificationData = {
            message: 'Shift starting in 15 minutes',
            priority: 'normal'
          };
          break;

        case 'line_efficiency_alert':
          targetUsers = data.supervisorIds || [];
          notificationType = 'efficiency_alert';
          notificationData = {
            stationName: data.stationName,
            idleTime: data.idleTime
          };
          break;

        case 'daily_target_achieved':
          targetUsers = data.operatorIds || [];
          notificationType = 'target_achieved';
          notificationData = {
            targetType: 'daily_production',
            percentage: data.percentage
          };
          break;

        default:
          return new Response(JSON.stringify({
            success: false,
            error: 'Unknown bulk notification scenario'
          }), {
            status: 400,
            headers
          });
      }

      const sentNotifications: Notification[] = [];

      for (const userId of targetUsers) {
        const notificationContent = createNotificationTemplate(notificationType, notificationData, data.language || 'np');
        
        const notification: Notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          ...notificationContent,
          read: false,
          createdAt: new Date().toISOString()
        };

        notifications.push(notification);
        sentNotifications.push(notification);

        // Send push notification
        await sendPushNotification(userId, notificationContent);
      }

      return new Response(JSON.stringify({
        success: true,
        scenario,
        sentNotifications,
        count: sentNotifications.length
      }), {
        status: 200,
        headers
      });
    }

    // Get notification statistics
    if (method === 'GET' && url.pathname.endsWith('/notifications/stats')) {
      if (!userPayload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), {
          status: 401,
          headers
        });
      }

      const userNotifications = notifications.filter(n => n.userId === userPayload.sub);
      const totalNotifications = userNotifications.length;
      const unreadNotifications = userNotifications.filter(n => !n.read).length;
      const readNotifications = totalNotifications - unreadNotifications;

      const notificationsByType = userNotifications.reduce((acc, notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return new Response(JSON.stringify({
        success: true,
        stats: {
          totalNotifications,
          unreadNotifications,
          readNotifications,
          notificationsByType
        }
      }), {
        status: 200,
        headers
      });
    }

    // Default 404 for unmatched routes
    return new Response(JSON.stringify({
      success: false,
      error: 'Endpoint not found'
    }), {
      status: 404,
      headers
    });

  } catch (error) {
    console.error('Notifications API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers
    });
  }
};

export const config: Config = {
  path: "/api/notifications/*"
};
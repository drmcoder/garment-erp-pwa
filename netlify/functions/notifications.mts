// netlify/functions/notifications.mts
// Push notification handler for Garment ERP

import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  // Handle CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers
    });
  }

  try {
    const body = await req.json();
    const { 
      userId, 
      notification, 
      language = 'np',
      type = 'general'
    } = body;

    // Validate required fields
    if (!userId || !notification) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: userId, notification' 
      }), {
        status: 400,
        headers
      });
    }

    // Format notification for Nepali/English
    const formattedNotification = formatNotification(notification, language, type);

    // In production, you would:
    // 1. Validate the user exists in Firebase
    // 2. Send push notification via Firebase Admin SDK
    // 3. Store notification in Firestore
    
    // For now, simulate successful notification sending
    console.log('Sending notification:', {
      userId,
      notification: formattedNotification,
      language,
      type,
      timestamp: new Date().toISOString()
    });

    const response = {
      success: true,
      message: language === 'np' ? 'सूचना पठाइयो' : 'Notification sent',
      notificationId: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      formattedNotification
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Notification function error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers
    });
  }
};

// Helper function to format notifications
function formatNotification(notification: any, language: string, type: string) {
  const { title, message, data = {} } = notification;

  // Add appropriate emoji and formatting based on type
  const typeEmojis = {
    workAssigned: '🔔',
    workCompleted: '✅',
    qualityIssue: '🚨',
    efficiency: '📊',
    earning: '💰',
    reminder: '⏰',
    urgent: '🚨'
  };

  const emoji = typeEmojis[type as keyof typeof typeEmojis] || '📢';

  return {
    title: `${emoji} ${title}`,
    message,
    data: {
      ...data,
      language,
      type,
      timestamp: new Date().toISOString()
    },
    badge: '/icons/badge-96x96.png',
    icon: `/icons/${type || 'default'}-notification.png`
  };
}

export const config: Config = {
  path: "/api/notifications"
};
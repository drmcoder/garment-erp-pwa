import type { Context, Config } from "@netlify/functions";

interface Notification {
  id: string;
  title: string;
  titleNp?: string;
  message: string;
  messageNp?: string;
  type: "info" | "success" | "warning" | "error" | "quality_alert";
  priority: "low" | "medium" | "high" | "urgent";
  targetUser?: string;
  targetRole?: string;
  bundleId?: string;
  read: boolean;
  actionRequired?: boolean;
  createdAt: string;
  readAt?: string;
}

// Demo notifications data
let DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-001",
    title: "New Work Assignment",
    titleNp: "नयाँ काम तोकिएको",
    message: "Bundle #12 has been assigned to you",
    messageNp: "बन्डल #१२ तपाईंलाई तोकिएको छ",
    type: "info",
    priority: "medium",
    targetUser: "op001",
    bundleId: "bundle-001",
    read: false,
    actionRequired: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "notif-002",
    title: "Quality Issue",
    titleNp: "गुणस्तर समस्या",
    message: "Quality issue reported in Bundle #15",
    messageNp: "बन्डल #१५ मा गुणस्तर समस्या रिपोर्ट गरिएको",
    type: "quality_alert",
    priority: "high",
    targetRole: "supervisor",
    bundleId: "bundle-002",
    read: false,
    actionRequired: true,
    createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
  },
  {
    id: "notif-003",
    title: "Production Target Achieved",
    titleNp: "उत्पादन लक्ष्य पूरा",
    message: "Daily production target achieved - 450 pieces completed",
    messageNp: "दैनिक उत्पादन लक्ष्य पूरा - ४५० टुक्रा पूरा",
    type: "success",
    priority: "medium",
    targetRole: "supervisor",
    read: true,
    actionRequired: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    readAt: new Date(Date.now() - 1800000).toISOString(), // Read 30 minutes ago
  },
];

export default async (req: Request, context: Context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const notificationId = pathSegments[pathSegments.length - 1];

    switch (req.method) {
      case "GET":
        if (notificationId && notificationId !== "notifications") {
          return await getNotificationById(notificationId, corsHeaders);
        } else {
          return await getAllNotifications(url, corsHeaders);
        }
      case "POST":
        return await createNotification(req, corsHeaders);
      case "PUT":
        return await markAsRead(notificationId, corsHeaders);
      case "DELETE":
        return await deleteNotification(notificationId, corsHeaders);
      default:
        return new Response(
          JSON.stringify({ success: false, error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Notifications function error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

async function getAllNotifications(url: URL, corsHeaders: Record<string, string>) {
  const params = url.searchParams;
  const userId = params.get("userId");
  const role = params.get("role");
  const unreadOnly = params.get("unreadOnly") === "true";
  const type = params.get("type");
  const priority = params.get("priority");
  const limit = parseInt(params.get("limit") || "50");

  let filteredNotifications = [...DEMO_NOTIFICATIONS];

  // Filter by user or role
  if (userId) {
    filteredNotifications = filteredNotifications.filter(
      (n) => n.targetUser === userId || (!n.targetUser && n.targetRole === role)
    );
  } else if (role) {
    filteredNotifications = filteredNotifications.filter(
      (n) => n.targetRole === role || (!n.targetRole && !n.targetUser)
    );
  }

  // Filter by read status
  if (unreadOnly) {
    filteredNotifications = filteredNotifications.filter((n) => !n.read);
  }

  // Filter by type
  if (type) {
    filteredNotifications = filteredNotifications.filter((n) => n.type === type);
  }

  // Filter by priority
  if (priority) {
    filteredNotifications = filteredNotifications.filter((n) => n.priority === priority);
  }

  // Sort by creation time (newest first), with priority consideration
  filteredNotifications.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority] || 1;
    const bPriority = priorityOrder[b.priority] || 1;
    
    // First sort by unread status (unread first)
    if (a.read !== b.read) {
      return a.read ? 1 : -1;
    }
    
    // Then by priority
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    // Finally by creation time
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Apply limit
  filteredNotifications = filteredNotifications.slice(0, limit);

  // Calculate summary stats
  const unreadCount = DEMO_NOTIFICATIONS.filter((n) => {
    if (userId) {
      return (n.targetUser === userId || (!n.targetUser && n.targetRole === role)) && !n.read;
    }
    if (role) {
      return (n.targetRole === role || (!n.targetRole && !n.targetUser)) && !n.read;
    }
    return !n.read;
  }).length;

  const urgentCount = filteredNotifications.filter((n) => n.priority === "urgent" && !n.read).length;

  return new Response(
    JSON.stringify({ 
      success: true, 
      notifications: filteredNotifications,
      summary: {
        total: filteredNotifications.length,
        unread: unreadCount,
        urgent: urgentCount
      }
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function getNotificationById(
  notificationId: string,
  corsHeaders: Record<string, string>
) {
  const notification = DEMO_NOTIFICATIONS.find((n) => n.id === notificationId);

  if (!notification) {
    return new Response(
      JSON.stringify({ success: false, error: "Notification not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, notification }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function createNotification(req: Request, corsHeaders: Record<string, string>) {
  const notificationData = await req.json();

  // Validate required fields
  const requiredFields = ['title', 'message', 'type'];
  const missingFields = requiredFields.filter(field => !notificationData[field]);
  
  if (missingFields.length > 0) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const newNotification: Notification = {
    id: `notif-${Date.now()}`,
    ...notificationData,
    read: false,
    priority: notificationData.priority || "medium",
    createdAt: new Date().toISOString(),
  };

  DEMO_NOTIFICATIONS.push(newNotification);

  // In production, trigger push notification here
  console.log(`📱 Push notification sent: ${newNotification.title}`);

  return new Response(
    JSON.stringify({ success: true, notification: newNotification }),
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function markAsRead(notificationId: string, corsHeaders: Record<string, string>) {
  const notificationIndex = DEMO_NOTIFICATIONS.findIndex(
    (n) => n.id === notificationId
  );

  if (notificationIndex === -1) {
    return new Response(
      JSON.stringify({ success: false, error: "Notification not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  DEMO_NOTIFICATIONS[notificationIndex].read = true;
  DEMO_NOTIFICATIONS[notificationIndex].readAt = new Date().toISOString();

  return new Response(
    JSON.stringify({
      success: true,
      notification: DEMO_NOTIFICATIONS[notificationIndex],
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function deleteNotification(
  notificationId: string,
  corsHeaders: Record<string, string>
) {
  const notificationIndex = DEMO_NOTIFICATIONS.findIndex(
    (n) => n.id === notificationId
  );

  if (notificationIndex === -1) {
    return new Response(
      JSON.stringify({ success: false, error: "Notification not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  DEMO_NOTIFICATIONS.splice(notificationIndex, 1);

  return new Response(
    JSON.stringify({ success: true, message: "Notification deleted successfully" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

export const config: Config = {
  path: ["/api/notifications", "/api/notifications/*"],
};
import type { Context, Config } from "@netlify/functions";

interface LoginRequest {
  username: string;
  password: string;
  role?: string;
  rememberMe?: boolean;
}

interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    username: string;
    name: string;
    nameEn: string;
    role: string;
    machine?: string;
    station?: string;
    department?: string;
    permissions: string[];
  };
  token?: string;
  error?: string;
}

// Demo users database (replace with Firebase in production)
const DEMO_USERS = [
  {
    id: "op001",
    username: "ram.singh",
    password: "password123",
    name: "राम सिंह",
    nameEn: "Ram Singh",
    role: "operator",
    machine: "overlock",
    station: "स्टेसन-1",
    department: "sewing",
    shift: "morning",
    dailyTarget: 120,
    rate: 2.5,
    permissions: ["work_view", "work_update", "quality_report"],
  },
  {
    id: "op002",
    username: "sita.devi",
    password: "password123",
    name: "सीता देवी",
    nameEn: "Sita Devi",
    role: "operator",
    machine: "flatlock",
    station: "स्टेसन-2",
    department: "sewing",
    shift: "morning",
    dailyTarget: 100,
    rate: 2.8,
    permissions: ["work_view", "work_update", "quality_report"],
  },
  {
    id: "sup001",
    username: "supervisor",
    password: "super123",
    name: "सुपरभाइजर",
    nameEn: "Supervisor",
    role: "supervisor",
    department: "production",
    permissions: [
      "work_view",
      "work_assign",
      "line_monitor",
      "quality_manage",
      "operator_manage",
    ],
  },
  {
    id: "mgmt001",
    username: "management",
    password: "mgmt123",
    name: "व्यवस्थापक",
    nameEn: "Manager",
    role: "management",
    department: "administration",
    permissions: [
      "all_access",
      "reports_view",
      "system_config",
      "user_manage",
      "financial_view",
    ],
  },
];

export default async (req: Request, context: Context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    switch (path) {
      case "login":
        return await handleLogin(req, corsHeaders);
      case "logout":
        return await handleLogout(req, corsHeaders);
      case "verify":
        return await handleVerifyToken(req, corsHeaders);
      case "refresh":
        return await handleRefreshToken(req, corsHeaders);
      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid endpoint" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Auth function error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

async function handleLogin(req: Request, corsHeaders: Record<string, string>) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { username, password, role = "operator" }: LoginRequest = await req.json();

  // Simulate database lookup
  const user = DEMO_USERS.find(
    (u) => u.username === username && u.password === password && u.role === role
  );

  if (!user) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "अवैध लगइन जानकारी / Invalid login credentials",
      }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Generate JWT token (simplified - use proper JWT library in production)
  const token = btoa(
    JSON.stringify({
      userId: user.id,
      username: user.username,
      role: user.role,
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    })
  );

  const response: AuthResponse = {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      nameEn: user.nameEn,
      role: user.role,
      machine: user.machine,
      station: user.station,
      department: user.department,
      permissions: user.permissions,
    },
    token,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleLogout(req: Request, corsHeaders: Record<string, string>) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // In production, invalidate the token in database/cache
  return new Response(
    JSON.stringify({ success: true, message: "Logged out successfully" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleVerifyToken(req: Request, corsHeaders: Record<string, string>) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ success: false, error: "No token provided" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = JSON.parse(atob(token));

    if (payload.exp < Date.now()) {
      return new Response(
        JSON.stringify({ success: false, error: "Token expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = DEMO_USERS.find((u) => u.id === payload.userId);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          nameEn: user.nameEn,
          role: user.role,
          machine: user.machine,
          station: user.station,
          department: user.department,
          permissions: user.permissions,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function handleRefreshToken(req: Request, corsHeaders: Record<string, string>) {
  // Implementation for token refresh
  return new Response(
    JSON.stringify({ success: true, message: "Token refresh not implemented yet" }),
    { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

export const config: Config = {
  path: ["/api/auth/login", "/api/auth/logout", "/api/auth/verify", "/api/auth/refresh"],
};
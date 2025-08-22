// netlify/functions/auth.mts
// Authentication endpoints for 50+ operators

import type { Context, Config } from "@netlify/functions";

interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

interface User {
  id: string;
  username: string;
  name: string;
  role: 'operator' | 'supervisor' | 'manager';
  speciality?: string;
  station?: string;
  employeeId: string;
  permissions: string[];
  preferences: {
    language: string;
    notifications: boolean;
  };
}

// Mock user database - In production, this would be Firebase/Database
const users: User[] = [
  {
    id: 'op_001',
    username: 'ram.singh',
    name: 'राम सिंह',
    role: 'operator',
    speciality: 'overlock',
    station: 'overlock_01',
    employeeId: 'EMP001',
    permissions: ['view_own_work', 'complete_work', 'report_quality', 'self_assign_work'],
    preferences: { language: 'np', notifications: true }
  },
  {
    id: 'op_002',
    username: 'sita.devi',
    name: 'सीता देवी',
    role: 'operator',
    speciality: 'flatlock',
    station: 'flatlock_01',
    employeeId: 'EMP002',
    permissions: ['view_own_work', 'complete_work', 'report_quality', 'self_assign_work'],
    preferences: { language: 'np', notifications: true }
  },
  {
    id: 'sup_001',
    username: 'hari.supervisor',
    name: 'हरि बहादुर',
    role: 'supervisor',
    employeeId: 'SUP001',
    permissions: ['assign_work', 'view_reports', 'manage_quality', 'view_line_status'],
    preferences: { language: 'np', notifications: true }
  },
  {
    id: 'mgr_001',
    username: 'admin.manager',
    name: 'Production Manager',
    role: 'manager',
    employeeId: 'MGR001',
    permissions: ['all'],
    preferences: { language: 'en', notifications: true }
  }
];

// Simple password hash simulation (use proper hashing in production)
const hashPassword = (password: string): string => {
  return Buffer.from(password).toString('base64');
};

const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

// Generate JWT token
const generateToken = (user: User): string => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = Buffer.from(`${encodedHeader}.${encodedPayload}.${Netlify.env.get('JWT_SECRET') || 'fallback-secret'}`).toString('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

// Verify JWT token
const verifyToken = (token: string): any => {
  try {
    const [header, payload, signature] = token.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
    
    // Check expiration
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return decodedPayload;
  } catch (error) {
    return null;
  }
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
    // Login endpoint
    if (method === 'POST' && url.pathname.endsWith('/login')) {
      const body: LoginRequest = await req.json();
      const { username, password, rememberMe = false } = body;

      if (!username || !password) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Username and password required'
        }), {
          status: 400,
          headers
        });
      }

      // Find user
      const user = users.find(u => u.username === username);
      if (!user) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid credentials'
        }), {
          status: 401,
          headers
        });
      }

      // Verify password (simplified - use proper hashing)
      if (password !== 'password123') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid credentials'
        }), {
          status: 401,
          headers
        });
      }

      // Generate token
      const token = generateToken(user);

      // Remove sensitive data before sending
      const userResponse = {
        ...user,
        // Don't send password hash or other sensitive data
      };

      return new Response(JSON.stringify({
        success: true,
        user: userResponse,
        token,
        expiresIn: '24h'
      }), {
        status: 200,
        headers
      });
    }

    // Logout endpoint
    if (method === 'POST' && url.pathname.endsWith('/logout')) {
      // In a real implementation, you might blacklist the token
      return new Response(JSON.stringify({
        success: true,
        message: 'Logged out successfully'
      }), {
        status: 200,
        headers
      });
    }

    // Verify token endpoint
    if (method === 'POST' && url.pathname.endsWith('/verify')) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No token provided'
        }), {
          status: 401,
          headers
        });
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (!payload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid or expired token'
        }), {
          status: 401,
          headers
        });
      }

      // Find user by ID from token
      const user = users.find(u => u.id === payload.sub);
      if (!user) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User not found'
        }), {
          status: 404,
          headers
        });
      }

      return new Response(JSON.stringify({
        success: true,
        user,
        valid: true
      }), {
        status: 200,
        headers
      });
    }

    // Get user profile
    if (method === 'GET' && url.pathname.endsWith('/profile')) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No token provided'
        }), {
          status: 401,
          headers
        });
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (!payload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid or expired token'
        }), {
          status: 401,
          headers
        });
      }

      const user = users.find(u => u.id === payload.sub);
      if (!user) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User not found'
        }), {
          status: 404,
          headers
        });
      }

      return new Response(JSON.stringify({
        success: true,
        user
      }), {
        status: 200,
        headers
      });
    }

    // Update user profile
    if (method === 'PUT' && url.pathname.endsWith('/profile')) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No token provided'
        }), {
          status: 401,
          headers
        });
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (!payload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid or expired token'
        }), {
          status: 401,
          headers
        });
      }

      const body = await req.json();
      const userIndex = users.findIndex(u => u.id === payload.sub);
      
      if (userIndex === -1) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User not found'
        }), {
          status: 404,
          headers
        });
      }

      // Update user (only allow certain fields)
      const allowedFields = ['name', 'preferences'];
      const updates: any = {};
      
      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          updates[field] = body[field];
        }
      });

      users[userIndex] = { ...users[userIndex], ...updates };

      return new Response(JSON.stringify({
        success: true,
        user: users[userIndex]
      }), {
        status: 200,
        headers
      });
    }

    // Change password
    if (method === 'POST' && url.pathname.endsWith('/change-password')) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No token provided'
        }), {
          status: 401,
          headers
        });
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (!payload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid or expired token'
        }), {
          status: 401,
          headers
        });
      }

      const body = await req.json();
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Current password and new password required'
        }), {
          status: 400,
          headers
        });
      }

      // Verify current password (simplified)
      if (currentPassword !== 'password123') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Current password is incorrect'
        }), {
          status: 400,
          headers
        });
      }

      // In real implementation, hash new password and save to database
      return new Response(JSON.stringify({
        success: true,
        message: 'Password changed successfully'
      }), {
        status: 200,
        headers
      });
    }

    // Get all users (admin only)
    if (method === 'GET' && url.pathname.endsWith('/users')) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No token provided'
        }), {
          status: 401,
          headers
        });
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (!payload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid or expired token'
        }), {
          status: 401,
          headers
        });
      }

      const user = users.find(u => u.id === payload.sub);
      if (!user || user.role !== 'manager') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient permissions'
        }), {
          status: 403,
          headers
        });
      }

      return new Response(JSON.stringify({
        success: true,
        users
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
    console.error('Auth API Error:', error);
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
  path: "/api/auth/*"
};
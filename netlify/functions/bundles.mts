// netlify/functions/bundles.mts
// Bundle management CRUD operations for work bundles

import type { Context, Config } from "@netlify/functions";

interface Bundle {
  id: string;
  articleNumber: string;
  articleName: string;
  englishName: string;
  color: string;
  size: string;
  pieces: number;
  operation: string;
  englishOperation: string;
  machineType: string;
  englishMachine: string;
  rate: number;
  estimatedTime: number;
  priority: 'उच्च' | 'सामान्य' | 'कम' | 'High' | 'Normal' | 'Low';
  difficulty: 'सजिलो' | 'मध्यम' | 'कठिन' | 'Easy' | 'Medium' | 'Hard';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'quality_check';
  assignedTo?: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  qualityScore?: number;
  defectCount?: number;
  createdAt: string;
  updatedAt: string;
  lotNumber?: string;
  recommendations?: {
    match: number;
    reasons: string[];
  };
}

// Mock bundle database - In production, this would be Firebase/Database
let bundles: Bundle[] = [
  {
    id: 'bundle_001',
    articleNumber: '8085',
    articleName: 'नीलो टी-शर्ट',
    englishName: 'Blue T-Shirt',
    color: 'नीलो-१',
    size: 'XL',
    pieces: 30,
    operation: 'काँध जोड्ने',
    englishOperation: 'Shoulder Join',
    machineType: 'ओभरलक',
    englishMachine: 'Overlock',
    rate: 2.50,
    estimatedTime: 25,
    priority: 'सामान्य',
    difficulty: 'सजिलो',
    status: 'assigned',
    assignedTo: 'op_001',
    assignedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    lotNumber: 'LOT-2025-001',
    recommendations: {
      match: 95,
      reasons: ['तपाईंको विशेषता', 'उच्च दर', 'सजिलो काम']
    }
  },
  {
    id: 'bundle_002',
    articleNumber: '2233',
    articleName: 'हरियो पोलो',
    englishName: 'Green Polo',
    color: 'हरियो-२',
    size: '2XL',
    pieces: 28,
    operation: 'हेम फोल्ड',
    englishOperation: 'Hem Fold',
    machineType: 'फ्ल्यालक',
    englishMachine: 'Flatlock',
    rate: 2.80,
    estimatedTime: 20,
    priority: 'उच्च',
    difficulty: 'मध्यम',
    status: 'pending',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date().toISOString(),
    lotNumber: 'LOT-2025-002',
    recommendations: {
      match: 88,
      reasons: ['राम्रो दर', 'छिटो काम', 'उच्च प्राथमिकता']
    }
  },
  {
    id: 'bundle_003',
    articleNumber: '6635',
    articleName: 'सेतो शर्ट',
    englishName: 'White Shirt',
    color: 'सेतो',
    size: 'L',
    pieces: 40,
    operation: 'प्लाकेट',
    englishOperation: 'Placket',
    machineType: 'एकल सुई',
    englishMachine: 'Single Needle',
    rate: 1.90,
    estimatedTime: 50,
    priority: 'कम',
    difficulty: 'कठिन',
    status: 'in_progress',
    assignedTo: 'op_003',
    assignedAt: new Date(Date.now() - 3600000).toISOString(),
    startedAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 21600000).toISOString(),
    updatedAt: new Date().toISOString(),
    lotNumber: 'LOT-2025-003',
    recommendations: {
      match: 65,
      reasons: ['नयाँ सिप सिक्न', 'लामो अभ्यास']
    }
  }
];

// Verify JWT token (simplified)
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

// Generate recommendation score based on operator skills
const generateRecommendations = (bundle: Bundle, operatorSpeciality: string): Bundle => {
  const machineMatches: Record<string, string[]> = {
    'overlock': ['ओभरलक', 'Overlock'],
    'flatlock': ['फ्ल्यालक', 'Flatlock'],
    'single_needle': ['एकल सुई', 'Single Needle'],
    'buttonhole': ['बटनहोल', 'Buttonhole']
  };

  let match = 50; // Base match score
  const reasons: string[] = [];

  // Check machine type compatibility
  if (machineMatches[operatorSpeciality]?.includes(bundle.machineType)) {
    match += 30;
    reasons.push('तपाईंको विशेषता');
  }

  // Check rate attractiveness
  if (bundle.rate >= 2.50) {
    match += 15;
    reasons.push('उच्च दर');
  }

  // Check difficulty appropriateness
  if (bundle.difficulty === 'सजिलो' || bundle.difficulty === 'Easy') {
    match += 10;
    reasons.push('सजिलो काम');
  }

  // Check priority
  if (bundle.priority === 'उच्च' || bundle.priority === 'High') {
    match += 5;
    reasons.push('उच्च प्राथमिकता');
  }

  return {
    ...bundle,
    recommendations: {
      match: Math.min(match, 99),
      reasons
    }
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
    // Verify authentication for most endpoints
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

    // Get all bundles with filtering
    if (method === 'GET' && url.pathname.endsWith('/bundles')) {
      const searchParams = url.searchParams;
      let filteredBundles = [...bundles];

      // Apply filters
      const status = searchParams.get('status');
      const machineType = searchParams.get('machineType');
      const priority = searchParams.get('priority');
      const assignedTo = searchParams.get('assignedTo');
      const operatorSpeciality = searchParams.get('operatorSpeciality');

      if (status && status !== 'all') {
        filteredBundles = filteredBundles.filter(bundle => bundle.status === status);
      }

      if (machineType && machineType !== 'all') {
        filteredBundles = filteredBundles.filter(bundle => 
          bundle.machineType === machineType || bundle.englishMachine === machineType
        );
      }

      if (priority && priority !== 'all') {
        filteredBundles = filteredBundles.filter(bundle => 
          bundle.priority === priority
        );
      }

      if (assignedTo) {
        filteredBundles = filteredBundles.filter(bundle => bundle.assignedTo === assignedTo);
      }

      // Generate recommendations if operator speciality provided
      if (operatorSpeciality) {
        filteredBundles = filteredBundles.map(bundle => 
          generateRecommendations(bundle, operatorSpeciality)
        );
        
        // Sort by recommendation match score
        filteredBundles.sort((a, b) => 
          (b.recommendations?.match || 0) - (a.recommendations?.match || 0)
        );
      }

      return new Response(JSON.stringify({
        success: true,
        bundles: filteredBundles,
        total: filteredBundles.length
      }), {
        status: 200,
        headers
      });
    }

    // Get single bundle by ID
    if (method === 'GET' && url.pathname.includes('/bundles/')) {
      const bundleId = url.pathname.split('/bundles/')[1];
      const bundle = bundles.find(b => b.id === bundleId);

      if (!bundle) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Bundle not found'
        }), {
          status: 404,
          headers
        });
      }

      return new Response(JSON.stringify({
        success: true,
        bundle
      }), {
        status: 200,
        headers
      });
    }

    // Create new bundle
    if (method === 'POST' && url.pathname.endsWith('/bundles')) {
      if (!userPayload || !['supervisor', 'manager'].includes(userPayload.role)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient permissions'
        }), {
          status: 403,
          headers
        });
      }

      const bundleData = await req.json();
      const newBundle: Bundle = {
        id: `bundle_${Date.now()}`,
        ...bundleData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      bundles.push(newBundle);

      return new Response(JSON.stringify({
        success: true,
        bundle: newBundle
      }), {
        status: 201,
        headers
      });
    }

    // Update bundle
    if (method === 'PUT' && url.pathname.includes('/bundles/')) {
      if (!userPayload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), {
          status: 401,
          headers
        });
      }

      const bundleId = url.pathname.split('/bundles/')[1];
      const bundleIndex = bundles.findIndex(b => b.id === bundleId);

      if (bundleIndex === -1) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Bundle not found'
        }), {
          status: 404,
          headers
        });
      }

      const updateData = await req.json();
      
      // Operators can only update certain fields
      if (userPayload.role === 'operator') {
        const allowedFields = ['status', 'startedAt', 'completedAt', 'qualityScore', 'defectCount'];
        const operatorUpdates: any = { updatedAt: new Date().toISOString() };
        
        allowedFields.forEach(field => {
          if (updateData[field] !== undefined) {
            operatorUpdates[field] = updateData[field];
          }
        });

        bundles[bundleIndex] = { ...bundles[bundleIndex], ...operatorUpdates };
      } else {
        // Supervisors and managers can update all fields
        bundles[bundleIndex] = { 
          ...bundles[bundleIndex], 
          ...updateData, 
          updatedAt: new Date().toISOString() 
        };
      }

      return new Response(JSON.stringify({
        success: true,
        bundle: bundles[bundleIndex]
      }), {
        status: 200,
        headers
      });
    }

    // Assign bundle to operator
    if (method === 'POST' && url.pathname.includes('/bundles/') && url.pathname.endsWith('/assign')) {
      if (!userPayload || !['supervisor', 'manager'].includes(userPayload.role)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient permissions'
        }), {
          status: 403,
          headers
        });
      }

      const bundleId = url.pathname.split('/bundles/')[1].replace('/assign', '');
      const { operatorId } = await req.json();

      const bundleIndex = bundles.findIndex(b => b.id === bundleId);
      if (bundleIndex === -1) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Bundle not found'
        }), {
          status: 404,
          headers
        });
      }

      bundles[bundleIndex] = {
        ...bundles[bundleIndex],
        status: 'assigned',
        assignedTo: operatorId,
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return new Response(JSON.stringify({
        success: true,
        bundle: bundles[bundleIndex]
      }), {
        status: 200,
        headers
      });
    }

    // Self-assign bundle (operator self-assignment)
    if (method === 'POST' && url.pathname.includes('/bundles/') && url.pathname.endsWith('/self-assign')) {
      if (!userPayload || userPayload.role !== 'operator') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Only operators can self-assign work'
        }), {
          status: 403,
          headers
        });
      }

      const bundleId = url.pathname.split('/bundles/')[1].replace('/self-assign', '');
      const bundleIndex = bundles.findIndex(b => b.id === bundleId);

      if (bundleIndex === -1) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Bundle not found'
        }), {
          status: 404,
          headers
        });
      }

      if (bundles[bundleIndex].status !== 'pending') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Bundle is not available for assignment'
        }), {
          status: 400,
          headers
        });
      }

      bundles[bundleIndex] = {
        ...bundles[bundleIndex],
        status: 'assigned',
        assignedTo: userPayload.sub,
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return new Response(JSON.stringify({
        success: true,
        bundle: bundles[bundleIndex],
        message: 'Work successfully self-assigned'
      }), {
        status: 200,
        headers
      });
    }

    // Complete bundle
    if (method === 'POST' && url.pathname.includes('/bundles/') && url.pathname.endsWith('/complete')) {
      if (!userPayload || userPayload.role !== 'operator') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Only operators can complete work'
        }), {
          status: 403,
          headers
        });
      }

      const bundleId = url.pathname.split('/bundles/')[1].replace('/complete', '');
      const { piecesCompleted, qualityScore, defectCount = 0 } = await req.json();

      const bundleIndex = bundles.findIndex(b => b.id === bundleId);
      if (bundleIndex === -1) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Bundle not found'
        }), {
          status: 404,
          headers
        });
      }

      const bundle = bundles[bundleIndex];
      if (bundle.assignedTo !== userPayload.sub) {
        return new Response(JSON.stringify({
          success: false,
          error: 'You can only complete work assigned to you'
        }), {
          status: 403,
          headers
        });
      }

      const earnings = piecesCompleted * bundle.rate;

      bundles[bundleIndex] = {
        ...bundles[bundleIndex],
        status: 'completed',
        completedAt: new Date().toISOString(),
        qualityScore,
        defectCount,
        updatedAt: new Date().toISOString()
      };

      return new Response(JSON.stringify({
        success: true,
        bundle: bundles[bundleIndex],
        earnings,
        message: 'Work completed successfully'
      }), {
        status: 200,
        headers
      });
    }

    // Delete bundle
    if (method === 'DELETE' && url.pathname.includes('/bundles/')) {
      if (!userPayload || userPayload.role !== 'manager') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Only managers can delete bundles'
        }), {
          status: 403,
          headers
        });
      }

      const bundleId = url.pathname.split('/bundles/')[1];
      const bundleIndex = bundles.findIndex(b => b.id === bundleId);

      if (bundleIndex === -1) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Bundle not found'
        }), {
          status: 404,
          headers
        });
      }

      bundles.splice(bundleIndex, 1);

      return new Response(JSON.stringify({
        success: true,
        message: 'Bundle deleted successfully'
      }), {
        status: 200,
        headers
      });
    }

    // Get bundle statistics
    if (method === 'GET' && url.pathname.endsWith('/bundles/stats')) {
      const totalBundles = bundles.length;
      const pendingBundles = bundles.filter(b => b.status === 'pending').length;
      const assignedBundles = bundles.filter(b => b.status === 'assigned').length;
      const inProgressBundles = bundles.filter(b => b.status === 'in_progress').length;
      const completedBundles = bundles.filter(b => b.status === 'completed').length;

      const avgCompletionTime = bundles
        .filter(b => b.completedAt && b.startedAt)
        .map(b => {
          const start = new Date(b.startedAt!).getTime();
          const end = new Date(b.completedAt!).getTime();
          return (end - start) / (1000 * 60); // minutes
        })
        .reduce((acc, time, _, arr) => acc + time / arr.length, 0);

      return new Response(JSON.stringify({
        success: true,
        stats: {
          totalBundles,
          pendingBundles,
          assignedBundles,
          inProgressBundles,
          completedBundles,
          avgCompletionTime: Math.round(avgCompletionTime)
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
    console.error('Bundles API Error:', error);
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
  path: "/api/bundles/*"
};
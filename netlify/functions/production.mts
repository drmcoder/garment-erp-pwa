// netlify/functions/production.mts
// Real-time production statistics and analytics

import type { Context, Config } from "@netlify/functions";

interface ProductionRecord {
  id: string;
  operatorId: string;
  bundleId: string;
  articleNumber: string;
  operation: string;
  machineType: string;
  piecesCompleted: number;
  timeSpent: number; // minutes
  rate: number;
  earnings: number;
  qualityScore: number;
  defectCount: number;
  efficiency: number;
  shift: 'morning' | 'afternoon' | 'night';
  date: string;
  createdAt: string;
}

interface EfficiencyRecord {
  id: string;
  operatorId: string;
  stationId: string;
  machineType: string;
  targetPieces: number;
  actualPieces: number;
  targetTime: number;
  actualTime: number;
  efficiency: number;
  idleTime: number;
  downtime: number;
  date: string;
  shift: string;
  createdAt: string;
}

interface LineStatus {
  lineId: string;
  lineName: string;
  totalStations: number;
  activeStations: number;
  idleStations: number;
  totalOperators: number;
  activeOperators: number;
  currentProduction: number;
  targetProduction: number;
  efficiency: number;
  bottleneckStation?: string;
  lastUpdated: string;
}

// Mock production data
let productionRecords: ProductionRecord[] = [
  {
    id: 'prod_001',
    operatorId: 'op_001',
    bundleId: 'bundle_001',
    articleNumber: '8085',
    operation: 'काँध जोड्ने',
    machineType: 'ओभरलक',
    piecesCompleted: 30,
    timeSpent: 25,
    rate: 2.50,
    earnings: 75.00,
    qualityScore: 98,
    defectCount: 0,
    efficiency: 92,
    shift: 'morning',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'prod_002',
    operatorId: 'op_002',
    bundleId: 'bundle_002',
    articleNumber: '2233',
    operation: 'हेम फोल्ड',
    machineType: 'फ्ल्यालक',
    piecesCompleted: 28,
    timeSpent: 22,
    rate: 2.80,
    earnings: 78.40,
    qualityScore: 95,
    defectCount: 1,
    efficiency: 88,
    shift: 'morning',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 1800000).toISOString()
  }
];

let efficiencyRecords: EfficiencyRecord[] = [
  {
    id: 'eff_001',
    operatorId: 'op_001',
    stationId: 'overlock_01',
    machineType: 'ओभरलक',
    targetPieces: 120,
    actualPieces: 110,
    targetTime: 480, // 8 hours in minutes
    actualTime: 475,
    efficiency: 92,
    idleTime: 15,
    downtime: 5,
    date: new Date().toISOString().split('T')[0],
    shift: 'morning',
    createdAt: new Date().toISOString()
  }
];

let lineStatuses: LineStatus[] = [
  {
    lineId: 'line_1',
    lineName: 'Production Line 1',
    totalStations: 12,
    activeStations: 11,
    idleStations: 1,
    totalOperators: 25,
    activeOperators: 24,
    currentProduction: 2450,
    targetProduction: 2800,
    efficiency: 87.5,
    bottleneckStation: 'flatlock_02',
    lastUpdated: new Date().toISOString()
  },
  {
    lineId: 'line_2',
    lineName: 'Production Line 2',
    totalStations: 12,
    activeStations: 12,
    idleStations: 0,
    totalOperators: 25,
    activeOperators: 25,
    currentProduction: 2680,
    targetProduction: 2800,
    efficiency: 95.7,
    lastUpdated: new Date().toISOString()
  }
];

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

// Calculate production statistics
const calculateProductionStats = (records: ProductionRecord[], dateFrom?: string, dateTo?: string) => {
  let filteredRecords = records;

  if (dateFrom || dateTo) {
    filteredRecords = records.filter(record => {
      const recordDate = record.date;
      if (dateFrom && recordDate < dateFrom) return false;
      if (dateTo && recordDate > dateTo) return false;
      return true;
    });
  }

  const totalPieces = filteredRecords.reduce((sum, record) => sum + record.piecesCompleted, 0);
  const totalEarnings = filteredRecords.reduce((sum, record) => sum + record.earnings, 0);
  const totalDefects = filteredRecords.reduce((sum, record) => sum + record.defectCount, 0);
  const avgQualityScore = filteredRecords.length > 0 
    ? filteredRecords.reduce((sum, record) => sum + record.qualityScore, 0) / filteredRecords.length 
    : 0;
  const avgEfficiency = filteredRecords.length > 0
    ? filteredRecords.reduce((sum, record) => sum + record.efficiency, 0) / filteredRecords.length
    : 0;

  const defectRate = totalPieces > 0 ? (totalDefects / totalPieces) * 100 : 0;

  return {
    totalPieces,
    totalEarnings,
    totalDefects,
    avgQualityScore: Math.round(avgQualityScore * 100) / 100,
    avgEfficiency: Math.round(avgEfficiency * 100) / 100,
    defectRate: Math.round(defectRate * 100) / 100,
    recordCount: filteredRecords.length
  };
};

// Calculate hourly production trend
const calculateHourlyTrend = (records: ProductionRecord[]) => {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(record => record.date === today);

  const hourlyData: Record<number, number> = {};
  
  todayRecords.forEach(record => {
    const hour = new Date(record.createdAt).getHours();
    hourlyData[hour] = (hourlyData[hour] || 0) + record.piecesCompleted;
  });

  // Fill missing hours with 0
  for (let hour = 6; hour <= 18; hour++) {
    if (!hourlyData[hour]) {
      hourlyData[hour] = 0;
    }
  }

  return Object.entries(hourlyData)
    .map(([hour, pieces]) => ({ hour: parseInt(hour), pieces }))
    .sort((a, b) => a.hour - b.hour);
};

// Calculate operator rankings
const calculateOperatorRankings = (records: ProductionRecord[]) => {
  const operatorStats: Record<string, any> = {};

  records.forEach(record => {
    if (!operatorStats[record.operatorId]) {
      operatorStats[record.operatorId] = {
        operatorId: record.operatorId,
        totalPieces: 0,
        totalEarnings: 0,
        totalDefects: 0,
        qualityScores: [],
        efficiencyScores: [],
        recordCount: 0
      };
    }

    const stats = operatorStats[record.operatorId];
    stats.totalPieces += record.piecesCompleted;
    stats.totalEarnings += record.earnings;
    stats.totalDefects += record.defectCount;
    stats.qualityScores.push(record.qualityScore);
    stats.efficiencyScores.push(record.efficiency);
    stats.recordCount++;
  });

  return Object.values(operatorStats).map((stats: any) => ({
    ...stats,
    avgQualityScore: stats.qualityScores.reduce((a: number, b: number) => a + b, 0) / stats.qualityScores.length,
    avgEfficiency: stats.efficiencyScores.reduce((a: number, b: number) => a + b, 0) / stats.efficiencyScores.length,
    defectRate: stats.totalPieces > 0 ? (stats.totalDefects / stats.totalPieces) * 100 : 0
  })).sort((a, b) => b.totalPieces - a.totalPieces);
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

    // Record production data
    if (method === 'POST' && url.pathname.endsWith('/production/record')) {
      if (!userPayload || userPayload.role !== 'operator') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Only operators can record production data'
        }), {
          status: 403,
          headers
        });
      }

      const body = await req.json();
      const {
        bundleId,
        articleNumber,
        operation,
        machineType,
        piecesCompleted,
        timeSpent,
        rate,
        qualityScore,
        defectCount = 0,
        shift
      } = body;

      const earnings = piecesCompleted * rate;
      const targetTime = piecesCompleted * 1.2; // Assume 1.2 minutes per piece target
      const efficiency = Math.round((targetTime / timeSpent) * 100);

      const productionRecord: ProductionRecord = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operatorId: userPayload.sub,
        bundleId,
        articleNumber,
        operation,
        machineType,
        piecesCompleted,
        timeSpent,
        rate,
        earnings,
        qualityScore,
        defectCount,
        efficiency,
        shift: shift || 'morning',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      productionRecords.push(productionRecord);

      return new Response(JSON.stringify({
        success: true,
        productionRecord,
        calculated: {
          earnings,
          efficiency
        }
      }), {
        status: 201,
        headers
      });
    }

    // Get production statistics
    if (method === 'GET' && url.pathname.endsWith('/production/stats')) {
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
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const operatorId = searchParams.get('operatorId');

      let filteredRecords = productionRecords;

      // Filter by operator if specified (operators can only see their own data)
      if (userPayload.role === 'operator') {
        filteredRecords = filteredRecords.filter(record => record.operatorId === userPayload.sub);
      } else if (operatorId) {
        filteredRecords = filteredRecords.filter(record => record.operatorId === operatorId);
      }

      const stats = calculateProductionStats(filteredRecords, dateFrom || undefined, dateTo || undefined);

      return new Response(JSON.stringify({
        success: true,
        stats,
        dateRange: { from: dateFrom, to: dateTo },
        operatorId: operatorId || (userPayload.role === 'operator' ? userPayload.sub : null)
      }), {
        status: 200,
        headers
      });
    }

    // Get hourly production trend
    if (method === 'GET' && url.pathname.endsWith('/production/hourly-trend')) {
      if (!userPayload || !['supervisor', 'manager'].includes(userPayload.role)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient permissions'
        }), {
          status: 403,
          headers
        });
      }

      const hourlyTrend = calculateHourlyTrend(productionRecords);

      return new Response(JSON.stringify({
        success: true,
        hourlyTrend,
        date: new Date().toISOString().split('T')[0]
      }), {
        status: 200,
        headers
      });
    }

    // Get operator rankings
    if (method === 'GET' && url.pathname.endsWith('/production/operator-rankings')) {
      if (!userPayload || !['supervisor', 'manager'].includes(userPayload.role)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient permissions'
        }), {
          status: 403,
          headers
        });
      }

      const searchParams = url.searchParams;
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      let filteredRecords = productionRecords;

      if (dateFrom || dateTo) {
        filteredRecords = productionRecords.filter(record => {
          const recordDate = record.date;
          if (dateFrom && recordDate < dateFrom) return false;
          if (dateTo && recordDate > dateTo) return false;
          return true;
        });
      }

      const rankings = calculateOperatorRankings(filteredRecords);

      return new Response(JSON.stringify({
        success: true,
        rankings,
        dateRange: { from: dateFrom, to: dateTo }
      }), {
        status: 200,
        headers
      });
    }

    // Get line status (real-time)
    if (method === 'GET' && url.pathname.endsWith('/production/line-status')) {
      if (!userPayload || !['supervisor', 'manager'].includes(userPayload.role)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient permissions'
        }), {
          status: 403,
          headers
        });
      }

      // Update line statuses with current data (in real app, this would be real-time)
      const updatedLineStatuses = lineStatuses.map(line => ({
        ...line,
        lastUpdated: new Date().toISOString()
      }));

      return new Response(JSON.stringify({
        success: true,
        lineStatuses: updatedLineStatuses,
        totalLines: updatedLineStatuses.length,
        overallEfficiency: updatedLineStatuses.reduce((sum, line) => sum + line.efficiency, 0) / updatedLineStatuses.length
      }), {
        status: 200,
        headers
      });
    }

    // Update line status
    if (method === 'PUT' && url.pathname.includes('/production/line-status/')) {
      if (!userPayload || !['supervisor', 'manager'].includes(userPayload.role)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient permissions'
        }), {
          status: 403,
          headers
        });
      }

      const lineId = url.pathname.split('/line-status/')[1];
      const lineIndex = lineStatuses.findIndex(line => line.lineId === lineId);

      if (lineIndex === -1) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Line not found'
        }), {
          status: 404,
          headers
        });
      }

      const updateData = await req.json();
      
      lineStatuses[lineIndex] = {
        ...lineStatuses[lineIndex],
        ...updateData,
        lastUpdated: new Date().toISOString()
      };

      return new Response(JSON.stringify({
        success: true,
        lineStatus: lineStatuses[lineIndex]
      }), {
        status: 200,
        headers
      });
    }

    // Record efficiency data
    if (method === 'POST' && url.pathname.endsWith('/production/efficiency')) {
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
      const {
        stationId,
        machineType,
        targetPieces,
        actualPieces,
        targetTime,
        actualTime,
        idleTime = 0,
        downtime = 0,
        shift
      } = body;

      const efficiency = Math.round((actualPieces / targetPieces) * 100);

      const efficiencyRecord: EfficiencyRecord = {
        id: `eff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operatorId: userPayload.sub,
        stationId,
        machineType,
        targetPieces,
        actualPieces,
        targetTime,
        actualTime,
        efficiency,
        idleTime,
        downtime,
        date: new Date().toISOString().split('T')[0],
        shift: shift || 'morning',
        createdAt: new Date().toISOString()
      };

      efficiencyRecords.push(efficiencyRecord);

      return new Response(JSON.stringify({
        success: true,
        efficiencyRecord
      }), {
        status: 201,
        headers
      });
    }

    // Get efficiency analytics
    if (method === 'GET' && url.pathname.endsWith('/production/efficiency')) {
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
      const operatorId = searchParams.get('operatorId');
      const stationId = searchParams.get('stationId');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      let filteredRecords = efficiencyRecords;

      // Filter by operator if specified
      if (userPayload.role === 'operator') {
        filteredRecords = filteredRecords.filter(record => record.operatorId === userPayload.sub);
      } else if (operatorId) {
        filteredRecords = filteredRecords.filter(record => record.operatorId === operatorId);
      }

      if (stationId) {
        filteredRecords = filteredRecords.filter(record => record.stationId === stationId);
      }

      if (dateFrom || dateTo) {
        filteredRecords = filteredRecords.filter(record => {
          const recordDate = record.date;
          if (dateFrom && recordDate < dateFrom) return false;
          if (dateTo && recordDate > dateTo) return false;
          return true;
        });
      }

      const avgEfficiency = filteredRecords.length > 0
        ? filteredRecords.reduce((sum, record) => sum + record.efficiency, 0) / filteredRecords.length
        : 0;

      const totalIdleTime = filteredRecords.reduce((sum, record) => sum + record.idleTime, 0);
      const totalDowntime = filteredRecords.reduce((sum, record) => sum + record.downtime, 0);

      return new Response(JSON.stringify({
        success: true,
        efficiency: {
          avgEfficiency: Math.round(avgEfficiency * 100) / 100,
          totalIdleTime,
          totalDowntime,
          recordCount: filteredRecords.length
        },
        records: filteredRecords
      }), {
        status: 200,
        headers
      });
    }

    // Get real-time dashboard data
    if (method === 'GET' && url.pathname.endsWith('/production/dashboard')) {
      if (!userPayload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), {
          status: 401,
          headers
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const todayRecords = productionRecords.filter(record => record.date === today);

      let dashboardData: any = {};

      if (userPayload.role === 'operator') {
        // Operator dashboard data
        const operatorRecords = todayRecords.filter(record => record.operatorId === userPayload.sub);
        dashboardData = calculateProductionStats(operatorRecords);
      } else {
        // Supervisor/Manager dashboard data
        dashboardData = {
          ...calculateProductionStats(todayRecords),
          lineStatuses,
          hourlyTrend: calculateHourlyTrend(productionRecords),
          topPerformers: calculateOperatorRankings(todayRecords).slice(0, 5)
        };
      }

      return new Response(JSON.stringify({
        success: true,
        dashboard: dashboardData,
        role: userPayload.role,
        date: today
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
    console.error('Production API Error:', error);
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
  path: "/api/production/*"
};
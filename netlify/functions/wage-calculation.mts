// netlify/functions/wage-calculation.mts
// Wage calculations, payroll, and earnings tracking

import type { Context, Config } from "@netlify/functions";

interface WageRecord {
  id: string;
  operatorId: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'night';
  workEntries: WorkEntry[];
  totalPieces: number;
  totalEarnings: number;
  bonuses: Bonus[];
  deductions: Deduction[];
  netEarnings: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimeEarnings: number;
  qualityScore: number;
  efficiencyScore: number;
  attendanceStatus: 'present' | 'absent' | 'half_day' | 'overtime';
  createdAt: string;
  updatedAt: string;
}

interface WorkEntry {
  bundleId: string;
  articleNumber: string;
  operation: string;
  pieces: number;
  rate: number;
  earnings: number;
  timeSpent: number; // minutes
  qualityScore: number;
  startTime: string;
  endTime: string;
}

interface Bonus {
  type: 'quality' | 'efficiency' | 'attendance' | 'target_achievement' | 'special';
  amount: number;
  description: string;
  criteria: any;
}

interface Deduction {
  type: 'advance' | 'loan' | 'fine' | 'tax' | 'other';
  amount: number;
  description: string;
  reference?: string;
}

interface PayrollSummary {
  operatorId: string;
  operatorName: string;
  month: string;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  totalPieces: number;
  baseEarnings: number;
  bonuses: number;
  deductions: number;
  overtimeEarnings: number;
  grossEarnings: number;
  netEarnings: number;
  avgDailyPieces: number;
  avgDailyEarnings: number;
  qualityScore: number;
  efficiencyScore: number;
  attendancePercentage: number;
}

interface PayslipData {
  id: string;
  operatorId: string;
  operatorName: string;
  employeeId: string;
  month: string;
  year: number;
  payPeriod: {
    from: string;
    to: string;
  };
  earnings: {
    basic: number;
    overtime: number;
    bonuses: Bonus[];
    total: number;
  };
  deductions: {
    advance: number;
    loans: number;
    fines: number;
    tax: number;
    other: number;
    total: number;
  };
  netPay: number;
  workSummary: {
    workingDays: number;
    presentDays: number;
    totalPieces: number;
    avgPiecesPerDay: number;
    qualityScore: number;
    efficiencyScore: number;
  };
  generatedAt: string;
  generatedBy: string;
}

// Mock wage data
let wageRecords: WageRecord[] = [
  {
    id: 'wage_001',
    operatorId: 'op_001',
    date: new Date().toISOString().split('T')[0],
    shift: 'morning',
    workEntries: [
      {
        bundleId: 'bundle_001',
        articleNumber: '8085',
        operation: 'काँध जोड्ने',
        pieces: 30,
        rate: 2.50,
        earnings: 75.00,
        timeSpent: 25,
        qualityScore: 98,
        startTime: '08:00',
        endTime: '08:25'
      },
      {
        bundleId: 'bundle_004',
        articleNumber: '2233',
        operation: 'साइड सिम',
        pieces: 25,
        rate: 2.80,
        earnings: 70.00,
        timeSpent: 22,
        qualityScore: 96,
        startTime: '09:00',
        endTime: '09:22'
      }
    ],
    totalPieces: 55,
    totalEarnings: 145.00,
    bonuses: [
      {
        type: 'quality',
        amount: 10.00,
        description: 'Quality bonus for >95% score',
        criteria: { minQualityScore: 95, actualScore: 97 }
      }
    ],
    deductions: [],
    netEarnings: 155.00,
    overtimeHours: 0,
    overtimeRate: 1.5,
    overtimeEarnings: 0,
    qualityScore: 97,
    efficiencyScore: 92,
    attendanceStatus: 'present',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let payslips: PayslipData[] = [];

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

// Calculate bonuses based on performance
const calculateBonuses = (wageRecord: WageRecord): Bonus[] => {
  const bonuses: Bonus[] = [];

  // Quality bonus
  if (wageRecord.qualityScore >= 95) {
    bonuses.push({
      type: 'quality',
      amount: wageRecord.totalEarnings * 0.05, // 5% bonus
      description: `Quality bonus for ${wageRecord.qualityScore}% score`,
      criteria: { minQualityScore: 95, actualScore: wageRecord.qualityScore }
    });
  }

  // Efficiency bonus
  if (wageRecord.efficiencyScore >= 90) {
    bonuses.push({
      type: 'efficiency',
      amount: wageRecord.totalEarnings * 0.03, // 3% bonus
      description: `Efficiency bonus for ${wageRecord.efficiencyScore}% score`,
      criteria: { minEfficiencyScore: 90, actualScore: wageRecord.efficiencyScore }
    });
  }

  // Daily target achievement bonus
  if (wageRecord.totalPieces >= 100) {
    bonuses.push({
      type: 'target_achievement',
      amount: 50.00, // Fixed amount
      description: `Daily target bonus for ${wageRecord.totalPieces} pieces`,
      criteria: { targetPieces: 100, actualPieces: wageRecord.totalPieces }
    });
  }

  // Perfect attendance bonus (check monthly)
  // This would require additional logic to check monthly attendance

  return bonuses;
};

// Calculate monthly payroll summary
const calculateMonthlyPayroll = (operatorId: string, month: string, year: number): PayrollSummary => {
  const monthlyRecords = wageRecords.filter(record => 
    record.operatorId === operatorId &&
    new Date(record.date).getMonth() === parseInt(month) - 1 &&
    new Date(record.date).getFullYear() === year
  );

  const workingDays = new Date(year, parseInt(month), 0).getDate(); // Days in month
  const presentDays = monthlyRecords.filter(r => r.attendanceStatus === 'present').length;
  const absentDays = workingDays - presentDays;

  const totalPieces = monthlyRecords.reduce((sum, record) => sum + record.totalPieces, 0);
  const baseEarnings = monthlyRecords.reduce((sum, record) => sum + record.totalEarnings, 0);
  const bonuses = monthlyRecords.reduce((sum, record) => 
    sum + record.bonuses.reduce((bonusSum, bonus) => bonusSum + bonus.amount, 0), 0
  );
  const deductions = monthlyRecords.reduce((sum, record) => 
    sum + record.deductions.reduce((deductionSum, deduction) => deductionSum + deduction.amount, 0), 0
  );
  const overtimeEarnings = monthlyRecords.reduce((sum, record) => sum + record.overtimeEarnings, 0);

  const grossEarnings = baseEarnings + bonuses + overtimeEarnings;
  const netEarnings = grossEarnings - deductions;

  const avgDailyPieces = presentDays > 0 ? totalPieces / presentDays : 0;
  const avgDailyEarnings = presentDays > 0 ? baseEarnings / presentDays : 0;

  const qualityScore = monthlyRecords.length > 0 
    ? monthlyRecords.reduce((sum, record) => sum + record.qualityScore, 0) / monthlyRecords.length 
    : 0;

  const efficiencyScore = monthlyRecords.length > 0
    ? monthlyRecords.reduce((sum, record) => sum + record.efficiencyScore, 0) / monthlyRecords.length
    : 0;

  const attendancePercentage = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;

  return {
    operatorId,
    operatorName: 'राम सिंह', // Would get from user data
    month,
    year,
    workingDays,
    presentDays,
    absentDays,
    totalPieces,
    baseEarnings,
    bonuses,
    deductions,
    overtimeEarnings,
    grossEarnings,
    netEarnings,
    avgDailyPieces,
    avgDailyEarnings,
    qualityScore,
    efficiencyScore,
    attendancePercentage
  };
};

// Generate payslip
const generatePayslip = (operatorId: string, month: string, year: number, generatedBy: string): PayslipData => {
  const payrollSummary = calculateMonthlyPayroll(operatorId, month, year);
  const monthlyRecords = wageRecords.filter(record => 
    record.operatorId === operatorId &&
    new Date(record.date).getMonth() === parseInt(month) - 1 &&
    new Date(record.date).getFullYear() === year
  );

  // Combine all bonuses
  const allBonuses: Bonus[] = [];
  monthlyRecords.forEach(record => {
    allBonuses.push(...record.bonuses);
  });

  // Combine all deductions
  const allDeductions: Deduction[] = [];
  monthlyRecords.forEach(record => {
    allDeductions.push(...record.deductions);
  });

  const deductionsByType = {
    advance: allDeductions.filter(d => d.type === 'advance').reduce((sum, d) => sum + d.amount, 0),
    loans: allDeductions.filter(d => d.type === 'loan').reduce((sum, d) => sum + d.amount, 0),
    fines: allDeductions.filter(d => d.type === 'fine').reduce((sum, d) => sum + d.amount, 0),
    tax: allDeductions.filter(d => d.type === 'tax').reduce((sum, d) => sum + d.amount, 0),
    other: allDeductions.filter(d => d.type === 'other').reduce((sum, d) => sum + d.amount, 0),
    total: payrollSummary.deductions
  };

  const firstDay = new Date(year, parseInt(month) - 1, 1).toISOString().split('T')[0];
  const lastDay = new Date(year, parseInt(month), 0).toISOString().split('T')[0];

  return {
    id: `payslip_${operatorId}_${year}_${month}`,
    operatorId,
    operatorName: payrollSummary.operatorName,
    employeeId: 'EMP001', // Would get from user data
    month,
    year,
    payPeriod: {
      from: firstDay,
      to: lastDay
    },
    earnings: {
      basic: payrollSummary.baseEarnings,
      overtime: payrollSummary.overtimeEarnings,
      bonuses: allBonuses,
      total: payrollSummary.grossEarnings
    },
    deductions: deductionsByType,
    netPay: payrollSummary.netEarnings,
    workSummary: {
      workingDays: payrollSummary.workingDays,
      presentDays: payrollSummary.presentDays,
      totalPieces: payrollSummary.totalPieces,
      avgPiecesPerDay: payrollSummary.avgDailyPieces,
      qualityScore: payrollSummary.qualityScore,
      efficiencyScore: payrollSummary.efficiencyScore
    },
    generatedAt: new Date().toISOString(),
    generatedBy
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

    // Record daily wage entry
    if (method === 'POST' && url.pathname.endsWith('/wages/record')) {
      if (!userPayload || userPayload.role !== 'operator') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Only operators can record wage entries'
        }), {
          status: 403,
          headers
        });
      }

      const body = await req.json();
      const {
        workEntries,
        shift = 'morning',
        overtimeHours = 0,
        attendanceStatus = 'present'
      } = body;

      if (!workEntries || !Array.isArray(workEntries)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Work entries are required'
        }), {
          status: 400,
          headers
        });
      }

      const totalPieces = workEntries.reduce((sum: number, entry: WorkEntry) => sum + entry.pieces, 0);
      const totalEarnings = workEntries.reduce((sum: number, entry: WorkEntry) => sum + entry.earnings, 0);
      const avgQualityScore = workEntries.reduce((sum: number, entry: WorkEntry) => sum + entry.qualityScore, 0) / workEntries.length;
      
      // Calculate efficiency based on time spent vs expected time
      const avgEfficiency = workEntries.reduce((sum: number, entry: WorkEntry) => {
        const expectedTime = entry.pieces * 1.2; // 1.2 minutes per piece
        const efficiency = (expectedTime / entry.timeSpent) * 100;
        return sum + efficiency;
      }, 0) / workEntries.length;

      const overtimeRate = 1.5; // 1.5x normal rate
      const avgRate = totalEarnings / totalPieces;
      const overtimeEarnings = overtimeHours * avgRate * overtimeRate;

      const wageRecord: WageRecord = {
        id: `wage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operatorId: userPayload.sub,
        date: new Date().toISOString().split('T')[0],
        shift,
        workEntries,
        totalPieces,
        totalEarnings,
        bonuses: [],
        deductions: [],
        netEarnings: totalEarnings,
        overtimeHours,
        overtimeRate,
        overtimeEarnings,
        qualityScore: avgQualityScore,
        efficiencyScore: avgEfficiency,
        attendanceStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Calculate and add bonuses
      wageRecord.bonuses = calculateBonuses(wageRecord);
      const totalBonuses = wageRecord.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
      wageRecord.netEarnings = totalEarnings + totalBonuses + overtimeEarnings;

      wageRecords.push(wageRecord);

      return new Response(JSON.stringify({
        success: true,
        wageRecord,
        calculated: {
          totalBonuses,
          netEarnings: wageRecord.netEarnings
        }
      }), {
        status: 201,
        headers
      });
    }

    // Get wage records
    if (method === 'GET' && url.pathname.endsWith('/wages')) {
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
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      let filteredRecords = wageRecords;

      // Filter by operator (operators can only see their own records)
      if (userPayload.role === 'operator') {
        filteredRecords = filteredRecords.filter(record => record.operatorId === userPayload.sub);
      } else if (operatorId) {
        filteredRecords = filteredRecords.filter(record => record.operatorId === operatorId);
      }

      // Filter by date range
      if (dateFrom || dateTo) {
        filteredRecords = filteredRecords.filter(record => {
          const recordDate = record.date;
          if (dateFrom && recordDate < dateFrom) return false;
          if (dateTo && recordDate > dateTo) return false;
          return true;
        });
      }

      // Sort by date (newest first)
      filteredRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Apply pagination
      const paginatedRecords = filteredRecords.slice(offset, offset + limit);

      return new Response(JSON.stringify({
        success: true,
        wageRecords: paginatedRecords,
        total: filteredRecords.length,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < filteredRecords.length
        }
      }), {
        status: 200,
        headers
      });
    }

    // Calculate monthly payroll
    if (method === 'GET' && url.pathname.endsWith('/wages/payroll')) {
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
      const month = searchParams.get('month') || (new Date().getMonth() + 1).toString();
      const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

      // Operators can only view their own payroll
      const targetOperatorId = userPayload.role === 'operator' ? userPayload.sub : operatorId;

      if (!targetOperatorId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Operator ID is required'
        }), {
          status: 400,
          headers
        });
      }

      const payrollSummary = calculateMonthlyPayroll(targetOperatorId, month, year);

      return new Response(JSON.stringify({
        success: true,
        payroll: payrollSummary
      }), {
        status: 200,
        headers
      });
    }

    // Generate payslip
    if (method === 'POST' && url.pathname.endsWith('/wages/payslip')) {
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
      const { operatorId, month, year } = body;

      // Operators can only generate their own payslips
      const targetOperatorId = userPayload.role === 'operator' ? userPayload.sub : operatorId;

      if (!targetOperatorId || !month || !year) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Operator ID, month, and year are required'
        }), {
          status: 400,
          headers
        });
      }

      const payslip = generatePayslip(targetOperatorId, month, year, userPayload.sub);
      
      // Store the generated payslip
      const existingIndex = payslips.findIndex(p => 
        p.operatorId === targetOperatorId && p.month === month && p.year === year
      );

      if (existingIndex >= 0) {
        payslips[existingIndex] = payslip;
      } else {
        payslips.push(payslip);
      }

      return new Response(JSON.stringify({
        success: true,
        payslip
      }), {
        status: 201,
        headers
      });
    }

    // Get existing payslips
    if (method === 'GET' && url.pathname.endsWith('/wages/payslips')) {
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
      const month = searchParams.get('month');
      const year = searchParams.get('year');

      let filteredPayslips = payslips;

      // Filter by operator (operators can only see their own payslips)
      if (userPayload.role === 'operator') {
        filteredPayslips = filteredPayslips.filter(payslip => payslip.operatorId === userPayload.sub);
      } else if (operatorId) {
        filteredPayslips = filteredPayslips.filter(payslip => payslip.operatorId === operatorId);
      }

      // Filter by month/year
      if (month) {
        filteredPayslips = filteredPayslips.filter(payslip => payslip.month === month);
      }
      if (year) {
        filteredPayslips = filteredPayslips.filter(payslip => payslip.year === parseInt(year));
      }

      // Sort by generation date (newest first)
      filteredPayslips.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

      return new Response(JSON.stringify({
        success: true,
        payslips: filteredPayslips,
        total: filteredPayslips.length
      }), {
        status: 200,
        headers
      });
    }

    // Add deduction
    if (method === 'POST' && url.pathname.endsWith('/wages/deduction')) {
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
      const { operatorId, date, type, amount, description, reference } = body;

      if (!operatorId || !date || !type || !amount) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Operator ID, date, type, and amount are required'
        }), {
          status: 400,
          headers
        });
      }

      // Find the wage record for the date
      const wageRecordIndex = wageRecords.findIndex(record => 
        record.operatorId === operatorId && record.date === date
      );

      if (wageRecordIndex === -1) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Wage record not found for the specified date'
        }), {
          status: 404,
          headers
        });
      }

      const deduction: Deduction = {
        type,
        amount,
        description,
        reference
      };

      wageRecords[wageRecordIndex].deductions.push(deduction);
      
      // Recalculate net earnings
      const totalDeductions = wageRecords[wageRecordIndex].deductions.reduce((sum, d) => sum + d.amount, 0);
      const totalBonuses = wageRecords[wageRecordIndex].bonuses.reduce((sum, b) => sum + b.amount, 0);
      wageRecords[wageRecordIndex].netEarnings = 
        wageRecords[wageRecordIndex].totalEarnings + 
        totalBonuses + 
        wageRecords[wageRecordIndex].overtimeEarnings - 
        totalDeductions;

      wageRecords[wageRecordIndex].updatedAt = new Date().toISOString();

      return new Response(JSON.stringify({
        success: true,
        deduction,
        updatedWageRecord: wageRecords[wageRecordIndex]
      }), {
        status: 200,
        headers
      });
    }

    // Get wage statistics
    if (method === 'GET' && url.pathname.endsWith('/wages/stats')) {
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
      const period = searchParams.get('period') || 'monthly'; // daily, weekly, monthly

      let filteredRecords = wageRecords;

      // Filter by operator
      if (userPayload.role === 'operator') {
        filteredRecords = filteredRecords.filter(record => record.operatorId === userPayload.sub);
      } else if (operatorId) {
        filteredRecords = filteredRecords.filter(record => record.operatorId === operatorId);
      }

      const totalRecords = filteredRecords.length;
      const totalPieces = filteredRecords.reduce((sum, record) => sum + record.totalPieces, 0);
      const totalEarnings = filteredRecords.reduce((sum, record) => sum + record.netEarnings, 0);
      const avgQualityScore = totalRecords > 0 
        ? filteredRecords.reduce((sum, record) => sum + record.qualityScore, 0) / totalRecords 
        : 0;
      const avgEfficiencyScore = totalRecords > 0
        ? filteredRecords.reduce((sum, record) => sum + record.efficiencyScore, 0) / totalRecords
        : 0;

      const avgDailyPieces = totalRecords > 0 ? totalPieces / totalRecords : 0;
      const avgDailyEarnings = totalRecords > 0 ? totalEarnings / totalRecords : 0;

      return new Response(JSON.stringify({
        success: true,
        stats: {
          period,
          totalRecords,
          totalPieces,
          totalEarnings,
          avgDailyPieces,
          avgDailyEarnings,
          avgQualityScore,
          avgEfficiencyScore
        },
        operatorId: operatorId || (userPayload.role === 'operator' ? userPayload.sub : null)
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
    console.error('Wage Calculation API Error:', error);
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
  path: "/api/wages/*"
};
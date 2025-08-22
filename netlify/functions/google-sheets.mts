// netlify/functions/google-sheets.mts
// Google Sheets WIP data import and synchronization

import type { Context, Config } from "@netlify/functions";

interface WIPData {
  id: string;
  lotNumber: string;
  date: string;
  articles: WIPArticle[];
  fabricStore: string;
  cuttingDepartment: string;
  fabricName: string;
  styleDetails: string;
  rollsInfo: {
    width: number;
    colors: WIPColor[];
  };
  lastSyncAt: string;
  sourceSheetId: string;
  sourceSheetName: string;
}

interface WIPArticle {
  articleNumber: string;
  styleName: string;
  colors: WIPColor[];
  totalPieces: number;
  fabricConsumption: number;
}

interface WIPColor {
  colorName: string;
  colorCode: string;
  sizes: WIPSize[];
  rollNumbers: string[];
  weight: number;
  layers: number;
}

interface WIPSize {
  size: string;
  pieces: number;
}

interface SyncLog {
  id: string;
  sheetId: string;
  sheetName: string;
  syncType: 'manual' | 'automatic';
  status: 'success' | 'failed' | 'partial';
  recordsProcessed: number;
  errors: string[];
  syncedAt: string;
  syncedBy: string;
}

// Mock WIP data storage
let wipData: WIPData[] = [
  {
    id: 'wip_001',
    lotNumber: 'LOT S-25',
    date: '2025-01-15',
    articles: [
      {
        articleNumber: '8085',
        styleName: 'Basic T-Shirt',
        colors: [
          {
            colorName: 'नीलो',
            colorCode: 'BLUE-1',
            sizes: [
              { size: 'L', pieces: 150 },
              { size: 'XL', pieces: 200 },
              { size: '2XL', pieces: 100 }
            ],
            rollNumbers: ['R001', 'R002'],
            weight: 45.5,
            layers: 12
          }
        ],
        totalPieces: 450,
        fabricConsumption: 225.5
      },
      {
        articleNumber: '2233',
        styleName: 'Polo Shirt',
        colors: [
          {
            colorName: 'हरियो',
            colorCode: 'GREEN-2',
            sizes: [
              { size: '2XL', pieces: 180 },
              { size: '3XL', pieces: 120 }
            ],
            rollNumbers: ['R003'],
            weight: 32.0,
            layers: 8
          }
        ],
        totalPieces: 300,
        fabricConsumption: 195.0
      }
    ],
    fabricStore: 'Store A',
    cuttingDepartment: 'Cutting Dept 1',
    fabricName: 'Cotton Jersey 180GSM',
    styleDetails: 'Round neck, short sleeve',
    rollsInfo: {
      width: 60,
      colors: []
    },
    lastSyncAt: new Date().toISOString(),
    sourceSheetId: 'mock_sheet_123',
    sourceSheetName: 'WIP_Data_Jan_2025'
  }
];

let syncLogs: SyncLog[] = [];

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

// Mock Google Sheets API response parser
const parseGoogleSheetData = (sheetData: any[][]): WIPData => {
  try {
    // Expected structure:
    // Row 0: LOT# S-XX, Date
    // Row 1: Article # XXXX, Style Name
    // Row 2: Fabric Store, Cutting Department  
    // Row 3: Name of fabric, Style details
    // Row 4: Rolls info, Width, Color headers
    // Row 5+: Color data, Roll numbers, Weights, Layer counts

    const lotInfo = sheetData[0] || [];
    const articleInfo = sheetData[1] || [];
    const departmentInfo = sheetData[2] || [];
    const fabricInfo = sheetData[3] || [];
    const rollsHeader = sheetData[4] || [];
    
    // Parse LOT number and date
    const lotNumber = lotInfo[0]?.toString().replace('LOT# ', '') || 'UNKNOWN';
    const date = lotInfo[1] || new Date().toISOString().split('T')[0];

    // Parse articles (handle multiple articles like 2233+2288+2211)
    const articleNumbers = articleInfo[0]?.toString().replace('Article # ', '').split('+') || [''];
    const styleName = articleInfo[1] || 'Unknown Style';

    // Parse department info
    const fabricStore = departmentInfo[0] || 'Unknown Store';
    const cuttingDepartment = departmentInfo[1] || 'Unknown Department';

    // Parse fabric info
    const fabricName = fabricInfo[0] || 'Unknown Fabric';
    const styleDetails = fabricInfo[1] || 'No details';

    // Parse roll width
    const width = parseInt(rollsHeader[1]?.toString() || '60');

    // Parse color data (rows 5+)
    const colorData = sheetData.slice(5);
    const colors: WIPColor[] = [];
    const articles: WIPArticle[] = [];

    // Process each article
    articleNumbers.forEach((articleNum, articleIndex) => {
      const articleColors: WIPColor[] = [];
      let totalPieces = 0;
      let fabricConsumption = 0;

      colorData.forEach((row, rowIndex) => {
        if (row && row.length >= 4) {
          const colorName = row[0]?.toString() || `Color ${rowIndex + 1}`;
          const rollNumbers = row[1]?.toString().split(',').map((r: string) => r.trim()) || [];
          const weight = parseFloat(row[2]?.toString() || '0');
          const layers = parseInt(row[3]?.toString() || '1');
          
          // Parse sizes (columns 4+)
          const sizes: WIPSize[] = [];
          for (let i = 4; i < row.length; i += 2) {
            const size = row[i]?.toString();
            const pieces = parseInt(row[i + 1]?.toString() || '0');
            if (size && pieces > 0) {
              sizes.push({ size, pieces });
              totalPieces += pieces;
            }
          }

          if (sizes.length > 0) {
            articleColors.push({
              colorName,
              colorCode: `${articleNum}-${colorName.toUpperCase()}`,
              sizes,
              rollNumbers,
              weight,
              layers
            });

            fabricConsumption += weight;
          }
        }
      });

      articles.push({
        articleNumber: articleNum.trim(),
        styleName,
        colors: articleColors,
        totalPieces,
        fabricConsumption
      });

      colors.push(...articleColors);
    });

    return {
      id: `wip_${Date.now()}`,
      lotNumber,
      date,
      articles,
      fabricStore,
      cuttingDepartment,
      fabricName,
      styleDetails,
      rollsInfo: {
        width,
        colors
      },
      lastSyncAt: new Date().toISOString(),
      sourceSheetId: 'imported_sheet',
      sourceSheetName: 'Imported Data'
    };

  } catch (error) {
    throw new Error(`Failed to parse sheet data: ${error}`);
  }
};

// Generate bundles from WIP data
const generateBundlesFromWIP = (wipData: WIPData) => {
  const bundles: any[] = [];
  let bundleCounter = 1;

  wipData.articles.forEach(article => {
    article.colors.forEach(color => {
      color.sizes.forEach(sizeData => {
        // Split large quantities into multiple bundles
        const maxBundleSize = 40;
        let remainingPieces = sizeData.pieces;

        while (remainingPieces > 0) {
          const bundlePieces = Math.min(remainingPieces, maxBundleSize);
          
          bundles.push({
            id: `bundle_${wipData.lotNumber}_${bundleCounter++}`,
            articleNumber: article.articleNumber,
            articleName: `${article.styleName} - ${color.colorName}`,
            color: color.colorName,
            size: sizeData.size,
            pieces: bundlePieces,
            operation: 'काटने', // Initial cutting operation
            machineType: 'कटिङ टेबल',
            rate: 0.50, // Default cutting rate
            status: 'pending',
            lotNumber: wipData.lotNumber,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          remainingPieces -= bundlePieces;
        }
      });
    });
  });

  return bundles;
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

    // Import WIP data from Google Sheets
    if (method === 'POST' && url.pathname.endsWith('/sheets/import')) {
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
      const { sheetId, sheetName, sheetData, autoGenerateBundles = true } = body;

      if (!sheetData || !Array.isArray(sheetData)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid sheet data format'
        }), {
          status: 400,
          headers
        });
      }

      try {
        // Parse the sheet data
        const parsedWIP = parseGoogleSheetData(sheetData);
        parsedWIP.sourceSheetId = sheetId || 'manual_import';
        parsedWIP.sourceSheetName = sheetName || 'Manual Import';

        // Store WIP data
        wipData.push(parsedWIP);

        // Generate bundles if requested
        let generatedBundles: any[] = [];
        if (autoGenerateBundles) {
          generatedBundles = generateBundlesFromWIP(parsedWIP);
        }

        // Log the sync
        const syncLog: SyncLog = {
          id: `sync_${Date.now()}`,
          sheetId: sheetId || 'manual',
          sheetName: sheetName || 'Manual Import',
          syncType: 'manual',
          status: 'success',
          recordsProcessed: 1,
          errors: [],
          syncedAt: new Date().toISOString(),
          syncedBy: userPayload.sub
        };

        syncLogs.push(syncLog);

        return new Response(JSON.stringify({
          success: true,
          wipData: parsedWIP,
          generatedBundles,
          bundleCount: generatedBundles.length,
          syncLog
        }), {
          status: 201,
          headers
        });

      } catch (error) {
        const syncLog: SyncLog = {
          id: `sync_${Date.now()}`,
          sheetId: sheetId || 'manual',
          sheetName: sheetName || 'Manual Import',
          syncType: 'manual',
          status: 'failed',
          recordsProcessed: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          syncedAt: new Date().toISOString(),
          syncedBy: userPayload.sub
        };

        syncLogs.push(syncLog);

        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Import failed',
          syncLog
        }), {
          status: 400,
          headers
        });
      }
    }

    // Get all WIP data
    if (method === 'GET' && url.pathname.endsWith('/sheets/wip')) {
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
      const lotNumber = searchParams.get('lotNumber');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      let filteredWIP = wipData;

      if (lotNumber) {
        filteredWIP = filteredWIP.filter(wip => 
          wip.lotNumber.toLowerCase().includes(lotNumber.toLowerCase())
        );
      }

      if (dateFrom || dateTo) {
        filteredWIP = filteredWIP.filter(wip => {
          const wipDate = wip.date;
          if (dateFrom && wipDate < dateFrom) return false;
          if (dateTo && wipDate > dateTo) return false;
          return true;
        });
      }

      return new Response(JSON.stringify({
        success: true,
        wipData: filteredWIP,
        total: filteredWIP.length
      }), {
        status: 200,
        headers
      });
    }

    // Get specific WIP data by ID
    if (method === 'GET' && url.pathname.includes('/sheets/wip/')) {
      if (!userPayload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), {
          status: 401,
          headers
        });
      }

      const wipId = url.pathname.split('/sheets/wip/')[1];
      const wip = wipData.find(w => w.id === wipId);

      if (!wip) {
        return new Response(JSON.stringify({
          success: false,
          error: 'WIP data not found'
        }), {
          status: 404,
          headers
        });
      }

      return new Response(JSON.stringify({
        success: true,
        wipData: wip
      }), {
        status: 200,
        headers
      });
    }

    // Generate bundles from existing WIP data
    if (method === 'POST' && url.pathname.includes('/sheets/wip/') && url.pathname.endsWith('/generate-bundles')) {
      if (!userPayload || !['supervisor', 'manager'].includes(userPayload.role)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient permissions'
        }), {
          status: 403,
          headers
        });
      }

      const wipId = url.pathname.split('/sheets/wip/')[1].replace('/generate-bundles', '');
      const wip = wipData.find(w => w.id === wipId);

      if (!wip) {
        return new Response(JSON.stringify({
          success: false,
          error: 'WIP data not found'
        }), {
          status: 404,
          headers
        });
      }

      const generatedBundles = generateBundlesFromWIP(wip);

      return new Response(JSON.stringify({
        success: true,
        bundles: generatedBundles,
        bundleCount: generatedBundles.length,
        wipData: wip
      }), {
        status: 200,
        headers
      });
    }

    // Sync with Google Sheets (automatic sync)
    if (method === 'POST' && url.pathname.endsWith('/sheets/sync')) {
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
      const { sheetConfigs = [] } = body; // Array of {sheetId, sheetName, range}

      const syncResults: any[] = [];
      let totalRecordsProcessed = 0;
      let totalErrors: string[] = [];

      for (const config of sheetConfigs) {
        const { sheetId, sheetName, range = 'A1:Z100' } = config;

        try {
          // In production, this would call the actual Google Sheets API
          // For now, we'll simulate with mock data
          const mockSheetData = [
            ['LOT# S-26', '2025-01-16'],
            ['Article # 9001+9002', 'Premium Collection'],
            ['Store B', 'Cutting Dept 2'],
            ['Cotton Blend 200GSM', 'V-neck, long sleeve'],
            ['Rolls', '65', 'Color', 'Roll#', 'Weight', 'Layers', 'L', 'Pieces', 'XL', 'Pieces'],
            ['सेतो', 'R010,R011', '28.5', '6', 'L', '120', 'XL', '180'],
            ['कालो', 'R012', '22.0', '5', 'L', '100', 'XL', '150']
          ];

          const parsedWIP = parseGoogleSheetData(mockSheetData);
          parsedWIP.sourceSheetId = sheetId;
          parsedWIP.sourceSheetName = sheetName;

          // Update or add WIP data
          const existingIndex = wipData.findIndex(w => 
            w.sourceSheetId === sheetId && w.sourceSheetName === sheetName
          );

          if (existingIndex >= 0) {
            wipData[existingIndex] = parsedWIP;
          } else {
            wipData.push(parsedWIP);
          }

          syncResults.push({
            sheetId,
            sheetName,
            status: 'success',
            recordsProcessed: 1,
            wipId: parsedWIP.id
          });

          totalRecordsProcessed++;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          totalErrors.push(`Sheet ${sheetName}: ${errorMessage}`);
          
          syncResults.push({
            sheetId,
            sheetName,
            status: 'failed',
            error: errorMessage,
            recordsProcessed: 0
          });
        }
      }

      const overallStatus = totalErrors.length === 0 ? 'success' : 
                           totalErrors.length < sheetConfigs.length ? 'partial' : 'failed';

      const syncLog: SyncLog = {
        id: `sync_${Date.now()}`,
        sheetId: 'multiple',
        sheetName: `Batch sync (${sheetConfigs.length} sheets)`,
        syncType: 'automatic',
        status: overallStatus,
        recordsProcessed: totalRecordsProcessed,
        errors: totalErrors,
        syncedAt: new Date().toISOString(),
        syncedBy: userPayload.sub
      };

      syncLogs.push(syncLog);

      return new Response(JSON.stringify({
        success: overallStatus !== 'failed',
        syncResults,
        summary: {
          totalSheets: sheetConfigs.length,
          successfulSheets: syncResults.filter(r => r.status === 'success').length,
          failedSheets: syncResults.filter(r => r.status === 'failed').length,
          totalRecordsProcessed,
          totalErrors: totalErrors.length
        },
        syncLog
      }), {
        status: overallStatus === 'failed' ? 400 : 200,
        headers
      });
    }

    // Get sync logs
    if (method === 'GET' && url.pathname.endsWith('/sheets/sync-logs')) {
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
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      const sortedLogs = syncLogs.sort((a, b) => 
        new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime()
      );

      const paginatedLogs = sortedLogs.slice(offset, offset + limit);

      return new Response(JSON.stringify({
        success: true,
        syncLogs: paginatedLogs,
        total: syncLogs.length,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < syncLogs.length
        }
      }), {
        status: 200,
        headers
      });
    }

    // Configure automatic sync schedule
    if (method === 'POST' && url.pathname.endsWith('/sheets/configure-sync')) {
      if (!userPayload || userPayload.role !== 'manager') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Only managers can configure sync settings'
        }), {
          status: 403,
          headers
        });
      }

      const body = await req.json();
      const { 
        enabled = true, 
        interval = 30, // minutes
        sheetConfigs = [],
        notifyOnErrors = true,
        autoGenerateBundles = true
      } = body;

      // In production, this would save to database and configure cron job
      const syncConfig = {
        id: 'sync_config_001',
        enabled,
        interval,
        sheetConfigs,
        notifyOnErrors,
        autoGenerateBundles,
        lastUpdated: new Date().toISOString(),
        updatedBy: userPayload.sub
      };

      return new Response(JSON.stringify({
        success: true,
        syncConfig,
        message: `Automatic sync ${enabled ? 'enabled' : 'disabled'} with ${interval} minute interval`
      }), {
        status: 200,
        headers
      });
    }

    // Validate sheet format
    if (method === 'POST' && url.pathname.endsWith('/sheets/validate')) {
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
      const { sheetData } = body;

      if (!sheetData || !Array.isArray(sheetData)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid sheet data format',
          validation: {
            valid: false,
            errors: ['Sheet data must be an array of rows']
          }
        }), {
          status: 400,
          headers
        });
      }

      const validation = {
        valid: true,
        errors: [] as string[],
        warnings: [] as string[],
        structure: {
          hasLotNumber: false,
          hasArticles: false,
          hasDepartmentInfo: false,
          hasFabricInfo: false,
          hasColorData: false,
          rowCount: sheetData.length
        }
      };

      try {
        // Validate structure
        if (sheetData.length < 5) {
          validation.errors.push('Sheet must have at least 5 rows');
          validation.valid = false;
        }

        // Check LOT number row
        const lotRow = sheetData[0];
        if (!lotRow || !lotRow[0]?.toString().includes('LOT')) {
          validation.errors.push('Row 1 must contain LOT number');
          validation.valid = false;
        } else {
          validation.structure.hasLotNumber = true;
        }

        // Check article row
        const articleRow = sheetData[1];
        if (!articleRow || !articleRow[0]?.toString().includes('Article')) {
          validation.errors.push('Row 2 must contain Article number(s)');
          validation.valid = false;
        } else {
          validation.structure.hasArticles = true;
        }

        // Check department info
        const deptRow = sheetData[2];
        if (deptRow && deptRow.length >= 2) {
          validation.structure.hasDepartmentInfo = true;
        } else {
          validation.warnings.push('Department information may be incomplete');
        }

        // Check fabric info
        const fabricRow = sheetData[3];
        if (fabricRow && fabricRow.length >= 2) {
          validation.structure.hasFabricInfo = true;
        } else {
          validation.warnings.push('Fabric information may be incomplete');
        }

        // Check color data
        const colorRows = sheetData.slice(5);
        if (colorRows.length > 0) {
          validation.structure.hasColorData = true;
          
          colorRows.forEach((row, index) => {
            if (row && row.length < 4) {
              validation.warnings.push(`Color row ${index + 6} may have incomplete data`);
            }
          });
        } else {
          validation.errors.push('No color data found');
          validation.valid = false;
        }

        // Test parsing
        if (validation.valid) {
          try {
            const testParse = parseGoogleSheetData(sheetData);
            validation.warnings.push(`Successfully parsed ${testParse.articles.length} articles`);
          } catch (parseError) {
            validation.errors.push(`Parse test failed: ${parseError}`);
            validation.valid = false;
          }
        }

      } catch (error) {
        validation.errors.push(`Validation error: ${error}`);
        validation.valid = false;
      }

      return new Response(JSON.stringify({
        success: true,
        validation
      }), {
        status: 200,
        headers
      });
    }

    // Export WIP data to different formats
    if (method === 'GET' && url.pathname.endsWith('/sheets/export')) {
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
      const format = searchParams.get('format') || 'json';
      const wipId = searchParams.get('wipId');

      let exportData = wipData;
      if (wipId) {
        const singleWip = wipData.find(w => w.id === wipId);
        exportData = singleWip ? [singleWip] : [];
      }

      if (format === 'csv') {
        // Convert to CSV format
        const csvRows = ['LOT Number,Date,Article,Style,Color,Size,Pieces,Roll Numbers,Weight'];
        
        exportData.forEach(wip => {
          wip.articles.forEach(article => {
            article.colors.forEach(color => {
              color.sizes.forEach(size => {
                csvRows.push([
                  wip.lotNumber,
                  wip.date,
                  article.articleNumber,
                  article.styleName,
                  color.colorName,
                  size.size,
                  size.pieces,
                  color.rollNumbers.join(';'),
                  color.weight
                ].join(','));
              });
            });
          });
        });

        return new Response(csvRows.join('\n'), {
          status: 200,
          headers: {
            ...headers,
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="wip_export.csv"'
          }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        exportData,
        format,
        exportedAt: new Date().toISOString(),
        recordCount: exportData.length
      }), {
        status: 200,
        headers
      });
    }

    // Delete WIP data
    if (method === 'DELETE' && url.pathname.includes('/sheets/wip/')) {
      if (!userPayload || userPayload.role !== 'manager') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Only managers can delete WIP data'
        }), {
          status: 403,
          headers
        });
      }

      const wipId = url.pathname.split('/sheets/wip/')[1];
      const wipIndex = wipData.findIndex(w => w.id === wipId);

      if (wipIndex === -1) {
        return new Response(JSON.stringify({
          success: false,
          error: 'WIP data not found'
        }), {
          status: 404,
          headers
        });
      }

      const deletedWip = wipData.splice(wipIndex, 1)[0];

      return new Response(JSON.stringify({
        success: true,
        message: 'WIP data deleted successfully',
        deletedWip
      }), {
        status: 200,
        headers
      });
    }

    // Get WIP statistics
    if (method === 'GET' && url.pathname.endsWith('/sheets/stats')) {
      if (!userPayload) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), {
          status: 401,
          headers
        });
      }

      const totalWipRecords = wipData.length;
      const totalArticles = wipData.reduce((sum, wip) => sum + wip.articles.length, 0);
      const totalPieces = wipData.reduce((sum, wip) => 
        sum + wip.articles.reduce((articleSum, article) => articleSum + article.totalPieces, 0), 0
      );
      const totalFabricConsumption = wipData.reduce((sum, wip) => 
        sum + wip.articles.reduce((articleSum, article) => articleSum + article.fabricConsumption, 0), 0
      );

      const recentSyncs = syncLogs
        .filter(log => log.status === 'success')
        .sort((a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime())
        .slice(0, 5);

      return new Response(JSON.stringify({
        success: true,
        stats: {
          totalWipRecords,
          totalArticles,
          totalPieces,
          totalFabricConsumption,
          lastSyncAt: recentSyncs[0]?.syncedAt || null,
          successfulSyncs: syncLogs.filter(log => log.status === 'success').length,
          failedSyncs: syncLogs.filter(log => log.status === 'failed').length
        },
        recentSyncs
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
    console.error('Google Sheets API Error:', error);
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
  path: "/api/sheets/*"
};
// netlify/functions/google-sheets.mts
// Google Sheets WIP data parser for Garment ERP

import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
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
    const { sheetsUrl, apiKey } = await req.json();
    
    if (!sheetsUrl) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Google Sheets URL is required' 
      }), {
        status: 400,
        headers
      });
    }

    // Extract sheet ID from URL
    const sheetIdMatch = sheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid Google Sheets URL format' 
      }), {
        status: 400,
        headers
      });
    }
    
    const sheetId = sheetIdMatch[1];
    
    // For demo/development - return mock data
    if (!apiKey || apiKey === 'demo') {
      console.log('Using demo mode for Google Sheets parsing');
      const mockData = getMockWIPData();
      
      return new Response(JSON.stringify({
        success: true,
        data: mockData,
        source: 'demo',
        message: 'Demo data returned - set REACT_APP_GOOGLE_SHEETS_API_KEY for live parsing'
      }), {
        status: 200,
        headers
      });
    }

    // Production: Call Google Sheets API
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z100?key=${apiKey}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
    }
    
    const apiData = await response.json();
    
    if (!apiData.values || apiData.values.length === 0) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No data found in the spreadsheet' 
      }), {
        status: 400,
        headers
      });
    }
    
    // Parse the actual WIP data structure
    const wipData = parseWIPStructure(apiData.values);
    
    return new Response(JSON.stringify({
      success: true,
      data: wipData,
      source: 'google-sheets',
      rowCount: apiData.values.length
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Google Sheets function error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check sheet permissions and API key'
    }), {
      status: 500,
      headers
    });
  }
};

// Parse WIP structure based on your specification
function parseWIPStructure(sheetData: string[][]) {
  try {
    // Row 0: LOT# S-XX, Date
    const row0 = sheetData[0] || [];
    const lotInfo = extractLotInfo(row0);

    // Row 1: Article # XXXX, Style Name
    const row1 = sheetData[1] || [];
    const articleInfo = extractArticleInfo(row1);

    // Row 2: Fabric Store, Cutting Department
    const row2 = sheetData[2] || [];
    const departmentInfo = extractDepartmentInfo(row2);

    // Row 3: Name of fabric, Style details
    const row3 = sheetData[3] || [];
    const fabricInfo = extractFabricInfo(row3);

    // Row 4: Rolls info, Width, Color headers
    const row4 = sheetData[4] || [];
    const colorHeaders = extractColorHeaders(row4);

    // Row 5+: Color data, Roll numbers, Weights, Layer counts
    const colorData = extractColorData(sheetData.slice(5), colorHeaders);

    return {
      lotNumber: lotInfo.lotNumber,
      date: lotInfo.date,
      articles: articleInfo.articles,
      articleNames: articleInfo.names,
      fabricStore: departmentInfo.fabricStore,
      cuttingDepartment: departmentInfo.cuttingDepartment,
      fabricName: fabricInfo.fabricName,
      fabricWeight: fabricInfo.weight,
      fabricWidth: fabricInfo.width,
      colors: colorData.colors,
      totalPieces: colorData.totalPieces,
      consumptionRate: calculateConsumptionRate(colorData.totalPieces, fabricInfo.weight),
      parsedAt: new Date().toISOString(),
      sheetInfo: {
        totalRows: sheetData.length,
        totalColumns: Math.max(...sheetData.map(row => row.length))
      }
    };

  } catch (error) {
    throw new Error(`WIP parsing failed: ${error instanceof Error ? error.message : 'Unknown parsing error'}`);
  }
}

// Helper functions for parsing
function extractLotInfo(row: string[]) {
  const cellText = row.join(' ').toUpperCase();
  
  const lotMatch = cellText.match(/LOT#?\s*([A-Z]-?\d+)/i);
  const lotNumber = lotMatch ? lotMatch[1] : `S-${Math.floor(Math.random() * 100)}`;

  const dateMatch = cellText.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
  const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString();

  return { lotNumber, date };
}

function extractArticleInfo(row: string[]) {
  const cellText = row.join(' ');
  
  const articleMatches = cellText.match(/\b\d{4}\b/g) || [];
  const articles = [...new Set(articleMatches)];

  const names = row.filter(cell => 
    cell && !cell.match(/^\d+$/) && cell.length > 2
  );

  return { articles, names };
}

function extractDepartmentInfo(row: string[]) {
  return {
    fabricStore: row[0] || 'Fabric Store',
    cuttingDepartment: row[1] || 'Cutting Department'
  };
}

function extractFabricInfo(row: string[]) {
  const cellText = row.join(' ');
  
  const weightMatch = cellText.match(/(\d+)\s*GSM/i);
  const weight = weightMatch ? `${weightMatch[1]} GSM` : '180 GSM';

  const widthMatch = cellText.match(/(\d+)\s*(inch|in|")/i);
  const width = widthMatch ? `${widthMatch[1]} inches` : '60 inches';

  return {
    fabricName: row[0] || 'Cotton Pique',
    weight,
    width,
    details: row.slice(1).join(' ')
  };
}

function extractColorHeaders(row: string[]) {
  const headers: any[] = [];
  let currentColor: any = null;

  row.forEach((cell, index) => {
    if (cell && cell.trim()) {
      if (isColorName(cell)) {
        currentColor = {
          name: cell,
          startIndex: index,
          sizeColumns: []
        };
        headers.push(currentColor);
      } else if (currentColor && isSizeName(cell)) {
        currentColor.sizeColumns.push({
          size: cell,
          index: index
        });
      }
    }
  });

  return headers;
}

function extractColorData(dataRows: string[][], colorHeaders: any[]) {
  const colors: any[] = [];
  let totalPieces = 0;

  colorHeaders.forEach(colorHeader => {
    const color = {
      name: colorHeader.name,
      nepaliName: translateColorToNepali(colorHeader.name),
      pieces: {} as Record<string, number>,
      layers: 0,
      totalPieces: 0
    };

    colorHeader.sizeColumns.forEach((sizeCol: any) => {
      let sizePieces = 0;

      dataRows.forEach(row => {
        const cellValue = row[sizeCol.index];
        if (cellValue && !isNaN(Number(cellValue))) {
          sizePieces += parseInt(cellValue);
        }
      });

      if (sizePieces > 0) {
        color.pieces[sizeCol.size] = sizePieces;
        color.totalPieces += sizePieces;
      }
    });

    color.layers = Math.ceil(color.totalPieces / 40);
    colors.push(color);
    totalPieces += color.totalPieces;
  });

  return { colors, totalPieces };
}

function isColorName(text: string): boolean {
  const colorKeywords = [
    'blue', 'red', 'green', 'black', 'white', 'yellow', 'navy', 'royal',
    'नीलो', 'रातो', 'हरियो', 'कालो', 'सेतो', 'पहेंलो'
  ];
  return colorKeywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
}

function isSizeName(text: string): boolean {
  const sizePattern = /^(XS|S|M|L|XL|2XL|3XL|4XL|5XL|\d+XL)$/i;
  return sizePattern.test(text.trim());
}

function translateColorToNepali(englishColor: string): string {
  const colorMap: Record<string, string> = {
    'blue': 'नीलो',
    'red': 'रातो', 
    'green': 'हरियो',
    'black': 'कालो',
    'white': 'सेतो',
    'yellow': 'पहेंलो',
    'navy': 'नेवी',
    'royal': 'रोयल'
  };

  const lowerColor = englishColor.toLowerCase();
  for (const [eng, nep] of Object.entries(colorMap)) {
    if (lowerColor.includes(eng)) {
      return englishColor.replace(new RegExp(eng, 'gi'), nep);
    }
  }
  return englishColor;
}

function calculateConsumptionRate(totalPieces: number, fabricWeight: string): number {
  const baseConsumption = 0.25;
  const weightFactor = fabricWeight.includes('180') ? 1.0 : 
                      fabricWeight.includes('200') ? 1.1 : 
                      fabricWeight.includes('160') ? 0.9 : 1.0;
  
  return baseConsumption * weightFactor;
}

// Mock data for demo
function getMockWIPData() {
  return {
    lotNumber: 'S-85',
    date: '22/08/2025',
    articles: ['8085', '2233'],
    articleNames: ['Polo T-Shirt', 'Basic T-Shirt'],
    fabricStore: 'Main Fabric Store',
    cuttingDepartment: 'Cutting Dept A',
    fabricName: 'Cotton Pique',
    fabricWeight: '180 GSM',
    fabricWidth: '60 inches',
    colors: [
      {
        name: 'Blue-1',
        nepaliName: 'नीलो-१',
        pieces: { 'L': 180, 'XL': 185, '2XL': 190, '3XL': 190 },
        layers: 19,
        totalPieces: 745
      },
      {
        name: 'Navy-2', 
        nepaliName: 'नेवी-२',
        pieces: { 'L': 150, 'XL': 160, '2XL': 170, '3XL': 180 },
        layers: 17,
        totalPieces: 660
      }
    ],
    totalPieces: 1405,
    consumptionRate: 0.25,
    parsedAt: new Date().toISOString()
  };
}

export const config: Config = {
  path: "/api/google-sheets"
};
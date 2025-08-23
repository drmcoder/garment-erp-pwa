import type { Context, Config } from "@netlify/functions";

// =====================================================
// ARTICLE SIZE MAPPING DATABASE
// =====================================================

interface ArticleSizeMapping {
  articleNumber: string;
  styleName: string;
  styleNameNp: string;
  category: 'tshirt' | 'polo' | 'shirt' | 'pant' | 'jacket' | 'dress';
  availableSizes: SizeInfo[];
  defaultOperations: OperationInfo[];
  fabricConsumption: number; // per piece in meters
  estimatedTime: number; // minutes per piece
}

interface SizeInfo {
  sizeName: string;
  sizeNameNp: string;
  measurements?: {
    chest?: number;
    length?: number;
    waist?: number;
    hip?: number;
  };
  isStandardSize: boolean;
}

interface OperationInfo {
  operationName: string;
  operationNameNp: string;
  machineType: string;
  rate: number; // per piece
  sequence: number;
  estimatedTime: number; // minutes
}

// Article-Size Database
const ARTICLE_SIZE_DATABASE: ArticleSizeMapping[] = [
  {
    articleNumber: '8085',
    styleName: 'Basic T-Shirt',
    styleNameNp: 'साधारण टी-शर्ट',
    category: 'tshirt',
    availableSizes: [
      { sizeName: 'XS', sizeNameNp: 'अति सानो', isStandardSize: true },
      { sizeName: 'S', sizeNameNp: 'सानो', isStandardSize: true },
      { sizeName: 'M', sizeNameNp: 'मध्यम', isStandardSize: true },
      { sizeName: 'L', sizeNameNp: 'ठूलो', isStandardSize: true },
      { sizeName: 'XL', sizeNameNp: 'अति ठूलो', isStandardSize: true },
      { sizeName: '2XL', sizeNameNp: '२ अति ठूलो', isStandardSize: true },
      { sizeName: '3XL', sizeNameNp: '३ अति ठूलो', isStandardSize: true }
    ],
    defaultOperations: [
      { operationName: 'Cutting', operationNameNp: 'काट्ने', machineType: 'cutting_table', rate: 0.5, sequence: 1, estimatedTime: 2 },
      { operationName: 'Shoulder Join', operationNameNp: 'काँध जोड्ने', machineType: 'overlock', rate: 2.5, sequence: 2, estimatedTime: 3 },
      { operationName: 'Side Seam', operationNameNp: 'साइड सिम', machineType: 'overlock', rate: 2.2, sequence: 3, estimatedTime: 4 },
      { operationName: 'Hem Stitch', operationNameNp: 'हेम स्टिच', machineType: 'flatlock', rate: 1.8, sequence: 4, estimatedTime: 2 }
    ],
    fabricConsumption: 0.8,
    estimatedTime: 11
  },
  {
    articleNumber: '2233',
    styleName: 'Polo T-Shirt',
    styleNameNp: 'पोलो टी-शर्ट',
    category: 'polo',
    availableSizes: [
      { sizeName: 'S', sizeNameNp: 'सानो', isStandardSize: true },
      { sizeName: 'M', sizeNameNp: 'मध्यम', isStandardSize: true },
      { sizeName: 'L', sizeNameNp: 'ठूलो', isStandardSize: true },
      { sizeName: 'XL', sizeNameNp: 'अति ठूलो', isStandardSize: true },
      { sizeName: '2XL', sizeNameNp: '२ अति ठूलो', isStandardSize: true },
      { sizeName: '3XL', sizeNameNp: '३ अति ठूलो', isStandardSize: true }
    ],
    defaultOperations: [
      { operationName: 'Cutting', operationNameNp: 'काट्ने', machineType: 'cutting_table', rate: 0.6, sequence: 1, estimatedTime: 3 },
      { operationName: 'Collar Attach', operationNameNp: 'कलर जोड्ने', machineType: 'singleNeedle', rate: 3.2, sequence: 2, estimatedTime: 5 },
      { operationName: 'Shoulder Join', operationNameNp: 'काँध जोड्ने', machineType: 'overlock', rate: 2.8, sequence: 3, estimatedTime: 4 },
      { operationName: 'Side Seam', operationNameNp: 'साइड सिम', machineType: 'overlock', rate: 2.5, sequence: 4, estimatedTime: 4 },
      { operationName: 'Hem Stitch', operationNameNp: 'हेम स्टिच', machineType: 'flatlock', rate: 2.0, sequence: 5, estimatedTime: 3 }
    ],
    fabricConsumption: 1.2,
    estimatedTime: 19
  },
  {
    articleNumber: '6635',
    styleName: 'Formal Shirt',
    styleNameNp: 'औपचारिक शर्ट',
    category: 'shirt',
    availableSizes: [
      { sizeName: '15', sizeNameNp: '१५', measurements: { chest: 38, length: 74 }, isStandardSize: true },
      { sizeName: '15.5', sizeNameNp: '१५.५', measurements: { chest: 40, length: 76 }, isStandardSize: true },
      { sizeName: '16', sizeNameNp: '१६', measurements: { chest: 42, length: 78 }, isStandardSize: true },
      { sizeName: '16.5', sizeNameNp: '१६.५', measurements: { chest: 44, length: 78 }, isStandardSize: true },
      { sizeName: '17', sizeNameNp: '१७', measurements: { chest: 46, length: 80 }, isStandardSize: true },
      { sizeName: '17.5', sizeNameNp: '१७.५', measurements: { chest: 48, length: 82 }, isStandardSize: true },
      { sizeName: '18', sizeNameNp: '१८', measurements: { chest: 50, length: 82 }, isStandardSize: true }
    ],
    defaultOperations: [
      { operationName: 'Cutting', operationNameNp: 'काट्ने', machineType: 'cutting_table', rate: 0.8, sequence: 1, estimatedTime: 4 },
      { operationName: 'Placket Making', operationNameNp: 'प्लाकेट बनाउने', machineType: 'singleNeedle', rate: 4.5, sequence: 2, estimatedTime: 8 },
      { operationName: 'Pocket Attach', operationNameNp: 'पकेट जोड्ने', machineType: 'singleNeedle', rate: 3.8, sequence: 3, estimatedTime: 6 },
      { operationName: 'Shoulder Join', operationNameNp: 'काँध जोड्ने', machineType: 'overlock', rate: 3.0, sequence: 4, estimatedTime: 4 },
      { operationName: 'Side Seam', operationNameNp: 'साइड सिम', machineType: 'overlock', rate: 2.8, sequence: 5, estimatedTime: 5 },
      { operationName: 'Collar Attach', operationNameNp: 'कलर जोड्ने', machineType: 'singleNeedle', rate: 5.2, sequence: 6, estimatedTime: 10 },
      { operationName: 'Cuff Attach', operationNameNp: 'कफ जोड्ने', machineType: 'singleNeedle', rate: 4.0, sequence: 7, estimatedTime: 6 },
      { operationName: 'Buttonhole', operationNameNp: 'बटनहोल', machineType: 'buttonhole', rate: 6.0, sequence: 8, estimatedTime: 8 },
      { operationName: 'Button Attach', operationNameNp: 'बटन जोड्ने', machineType: 'button_attach', rate: 3.5, sequence: 9, estimatedTime: 5 }
    ],
    fabricConsumption: 2.1,
    estimatedTime: 56
  },
  {
    articleNumber: '9001',
    styleName: 'Premium Polo',
    styleNameNp: 'प्रिमियम पोलो',
    category: 'polo',
    availableSizes: [
      { sizeName: 'S', sizeNameNp: 'सानो', isStandardSize: true },
      { sizeName: 'M', sizeNameNp: 'मध्यम', isStandardSize: true },
      { sizeName: 'L', sizeNameNp: 'ठूलो', isStandardSize: true },
      { sizeName: 'XL', sizeNameNp: 'अति ठूलो', isStandardSize: true },
      { sizeName: '2XL', sizeNameNp: '२ अति ठूलो', isStandardSize: true }
    ],
    defaultOperations: [
      { operationName: 'Cutting', operationNameNp: 'काट्ने', machineType: 'cutting_table', rate: 0.7, sequence: 1, estimatedTime: 3 },
      { operationName: 'Embroidery', operationNameNp: 'कढाई', machineType: 'embroidery', rate: 8.5, sequence: 2, estimatedTime: 12 },
      { operationName: 'Collar Attach', operationNameNp: 'कलर जोड्ने', machineType: 'singleNeedle', rate: 3.5, sequence: 3, estimatedTime: 6 },
      { operationName: 'Shoulder Join', operationNameNp: 'काँध जोड्ने', machineType: 'overlock', rate: 3.0, sequence: 4, estimatedTime: 4 },
      { operationName: 'Side Seam', operationNameNp: 'साइड सिम', machineType: 'overlock', rate: 2.8, sequence: 5, estimatedTime: 4 },
      { operationName: 'Hem Stitch', operationNameNp: 'हेम स्टिच', machineType: 'flatlock', rate: 2.2, sequence: 6, estimatedTime: 3 }
    ],
    fabricConsumption: 1.4,
    estimatedTime: 32
  }
];

// =====================================================
// IMPROVED GOOGLE SHEETS PARSING
// =====================================================

interface ParsedWIPData {
  lotNumber: string;
  date: string;
  articles: ParsedArticle[];
  fabricInfo: {
    storeName: string;
    cuttingDepartment: string;
    fabricName: string;
    fabricWidth: number;
    styleDetails: string;
  };
  processedAt: string;
  totalPieces: number;
  estimatedFabricConsumption: number;
}

interface ParsedArticle {
  articleNumber: string;
  articleInfo: ArticleSizeMapping | null;
  colors: ParsedColor[];
  totalPieces: number;
}

interface ParsedColor {
  colorName: string;
  colorCode: string;
  rollInfo: {
    rollNumbers: string[];
    totalWeight: number;
    layers: number;
  };
  sizes: ParsedSize[];
}

interface ParsedSize {
  sizeName: string;
  pieces: number;
  isValidSize: boolean;
  bundles?: GeneratedBundle[];
}

interface GeneratedBundle {
  id: string;
  articleNumber: string;
  articleName: string;
  articleNameNp: string;
  colorName: string;
  sizeName: string;
  pieces: number;
  operation: string;
  operationNp: string;
  machineType: string;
  rate: number;
  estimatedTime: number;
  lotNumber: string;
  sequence: number;
  status: 'pending';
  createdAt: string;
}

// Get article info by number
const getArticleInfo = (articleNumber: string): ArticleSizeMapping | null => {
  return ARTICLE_SIZE_DATABASE.find(art => art.articleNumber === articleNumber) || null;
};

// Validate size for article
const isValidSizeForArticle = (articleNumber: string, sizeName: string): boolean => {
  const articleInfo = getArticleInfo(articleNumber);
  if (!articleInfo) return false;
  
  return articleInfo.availableSizes.some(size => 
    size.sizeName.toLowerCase() === sizeName.toLowerCase()
  );
};

// Enhanced Google Sheets parser
const parseGoogleSheetData = (rawSheetData: any[][]): ParsedWIPData => {
  if (!Array.isArray(rawSheetData) || rawSheetData.length < 6) {
    throw new Error('Invalid sheet format. Expected minimum 6 rows.');
  }

  // Parse header information
  const lotRow = rawSheetData[0] || [];
  const articleRow = rawSheetData[1] || [];
  const departmentRow = rawSheetData[2] || [];
  const fabricRow = rawSheetData[3] || [];
  const headerRow = rawSheetData[4] || [];

  // Extract LOT number and date
  const lotInfo = lotRow[0]?.toString() || '';
  const lotNumber = lotInfo.replace(/^LOT#?\s*/i, '').trim() || `LOT-${Date.now()}`;
  const date = lotRow[1]?.toString() || new Date().toISOString().split('T')[0];

  // Extract article numbers (support for multiple articles like "2233+8085+6635")
  const articleInfo = articleRow[0]?.toString() || '';
  const articleNumbers = articleInfo
    .replace(/^Article#?\s*/i, '')
    .split(/[+,&]/)
    .map(num => num.trim())
    .filter(num => num);

  if (articleNumbers.length === 0) {
    throw new Error('No article numbers found in row 2');
  }

  // Extract department and fabric info
  const fabricInfo = {
    storeName: departmentRow[0]?.toString() || 'Unknown Store',
    cuttingDepartment: departmentRow[1]?.toString() || 'Unknown Department',
    fabricName: fabricRow[0]?.toString() || 'Unknown Fabric',
    fabricWidth: parseInt(headerRow[1]?.toString() || '60'),
    styleDetails: fabricRow[1]?.toString() || 'No style details',
  };

  // Parse color and size data (from row 5 onwards)
  const colorDataRows = rawSheetData.slice(5);
  const articles: ParsedArticle[] = [];
  let totalPieces = 0;
  let estimatedFabricConsumption = 0;

  // Process each article
  articleNumbers.forEach(articleNumber => {
    const articleInfo = getArticleInfo(articleNumber);
    const colors: ParsedColor[] = [];
    let articleTotalPieces = 0;

    // Process each color row
    colorDataRows.forEach((row, rowIndex) => {
      if (!row || row.length < 4) return;

      const colorName = row[0]?.toString()?.trim() || `Color-${rowIndex + 1}`;
      const rollNumbers = row[1]?.toString()
        .split(/[,;|]/)
        .map(r => r.trim())
        .filter(r => r) || [];
      const weight = parseFloat(row[2]?.toString() || '0');
      const layers = parseInt(row[3]?.toString() || '1');

      const sizes: ParsedSize[] = [];
      
      // Parse size data (starts from column 4, in pairs: size, pieces)
      for (let i = 4; i < row.length; i += 2) {
        const sizeName = row[i]?.toString()?.trim();
        const pieces = parseInt(row[i + 1]?.toString() || '0');

        if (sizeName && pieces > 0) {
          const isValidSize = isValidSizeForArticle(articleNumber, sizeName);
          
          if (!isValidSize && articleInfo) {
            console.warn(`Size ${sizeName} is not valid for article ${articleNumber}. Valid sizes: ${articleInfo.availableSizes.map(s => s.sizeName).join(', ')}`);
          }

          sizes.push({
            sizeName,
            pieces,
            isValidSize,
          });

          articleTotalPieces += pieces;
          totalPieces += pieces;
        }
      }

      if (sizes.length > 0) {
        colors.push({
          colorName,
          colorCode: `${articleNumber}-${colorName.toUpperCase().replace(/\s+/g, '-')}`,
          rollInfo: {
            rollNumbers,
            totalWeight: weight,
            layers,
          },
          sizes,
        });
      }
    });

    // Calculate fabric consumption
    if (articleInfo && articleTotalPieces > 0) {
      estimatedFabricConsumption += articleTotalPieces * articleInfo.fabricConsumption;
    }

    articles.push({
      articleNumber,
      articleInfo,
      colors,
      totalPieces: articleTotalPieces,
    });
  });

  return {
    lotNumber,
    date,
    articles,
    fabricInfo,
    processedAt: new Date().toISOString(),
    totalPieces,
    estimatedFabricConsumption,
  };
};

// Generate bundles with proper operations sequence
const generateBundlesFromParsedWIP = (wipData: ParsedWIPData): GeneratedBundle[] => {
  const bundles: GeneratedBundle[] = [];
  let bundleCounter = 1;

  wipData.articles.forEach(article => {
    const articleInfo = article.articleInfo;
    if (!articleInfo) {
      console.warn(`Article ${article.articleNumber} not found in database. Using default operations.`);
    }

    article.colors.forEach(color => {
      color.sizes.forEach(sizeData => {
        // Only generate bundles for valid sizes
        if (!sizeData.isValidSize && articleInfo) {
          console.warn(`Skipping invalid size ${sizeData.sizeName} for article ${article.articleNumber}`);
          return;
        }

        const operations = articleInfo?.defaultOperations || [
          { operationName: 'General Work', operationNameNp: 'सामान्य काम', machineType: 'general', rate: 2.0, sequence: 1, estimatedTime: 5 }
        ];

        // Generate bundles for each operation
        operations.forEach(operation => {
          const maxPiecesPerBundle = 35; // Adjust based on operation
          let remainingPieces = sizeData.pieces;

          while (remainingPieces > 0) {
            const bundlePieces = Math.min(remainingPieces, maxPiecesPerBundle);
            
            bundles.push({
              id: `${wipData.lotNumber.replace(/\s+/g, '-')}-${bundleCounter.toString().padStart(3, '0')}`,
              articleNumber: article.articleNumber,
              articleName: articleInfo?.styleName || `Article ${article.articleNumber}`,
              articleNameNp: articleInfo?.styleNameNp || `लेख ${article.articleNumber}`,
              colorName: color.colorName,
              sizeName: sizeData.sizeName,
              pieces: bundlePieces,
              operation: operation.operationName,
              operationNp: operation.operationNameNp,
              machineType: operation.machineType,
              rate: operation.rate,
              estimatedTime: operation.estimatedTime * bundlePieces,
              lotNumber: wipData.lotNumber,
              sequence: operation.sequence,
              status: 'pending',
              createdAt: new Date().toISOString(),
            });

            bundleCounter++;
            remainingPieces -= bundlePieces;
          }
        });
      });
    });
  });

  // Sort bundles by sequence to maintain operation order
  return bundles.sort((a, b) => {
    if (a.articleNumber !== b.articleNumber) {
      return a.articleNumber.localeCompare(b.articleNumber);
    }
    if (a.colorName !== b.colorName) {
      return a.colorName.localeCompare(b.colorName);
    }
    if (a.sizeName !== b.sizeName) {
      return a.sizeName.localeCompare(b.sizeName);
    }
    return a.sequence - b.sequence;
  });
};

// =====================================================
// NETLIFY FUNCTION HANDLER
// =====================================================

export default async (req: Request, context: Context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const headers = {
    "Content-Type": "application/json",
    ...corsHeaders,
  };

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(segment => segment);
    const endpoint = pathSegments[pathSegments.length - 1];

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    let userPayload = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = JSON.parse(atob(token));
        if (payload.exp > Date.now()) {
          userPayload = payload;
        }
      } catch (e) {
        // Invalid token
      }
    }

    // Get article-size database
    if (req.method === 'GET' && endpoint === 'articles') {
      return new Response(JSON.stringify({
        success: true,
        articles: ARTICLE_SIZE_DATABASE,
        totalArticles: ARTICLE_SIZE_DATABASE.length
      }), { status: 200, headers });
    }

    // Get specific article info
    if (req.method === 'GET' && endpoint.startsWith('article-')) {
      const articleNumber = endpoint.replace('article-', '');
      const articleInfo = getArticleInfo(articleNumber);
      
      if (!articleInfo) {
        return new Response(JSON.stringify({
          success: false,
          error: `Article ${articleNumber} not found in database`
        }), { status: 404, headers });
      }

      return new Response(JSON.stringify({
        success: true,
        article: articleInfo
      }), { status: 200, headers });
    }

    // Parse Google Sheets data
    if (req.method === 'POST' && endpoint === 'parse-sheet') {
      if (!userPayload || !['supervisor', 'manager', 'admin'].includes(userPayload.role)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient permissions. Supervisor role or higher required.'
        }), { status: 403, headers });
      }

      const { sheetData, generateBundles = true } = await req.json();

      if (!Array.isArray(sheetData)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid sheet data format. Expected array of rows.'
        }), { status: 400, headers });
      }

      try {
        const parsedWIP = parseGoogleSheetData(sheetData);
        let generatedBundles: GeneratedBundle[] = [];

        if (generateBundles) {
          generatedBundles = generateBundlesFromParsedWIP(parsedWIP);
        }

        // Generate validation report
        const validationReport = {
          articlesProcessed: parsedWIP.articles.length,
          totalPieces: parsedWIP.totalPieces,
          invalidSizes: [] as string[],
          unknownArticles: [] as string[],
          bundlesGenerated: generatedBundles.length,
        };

        parsedWIP.articles.forEach(article => {
          if (!article.articleInfo) {
            validationReport.unknownArticles.push(article.articleNumber);
          }

          article.colors.forEach(color => {
            color.sizes.forEach(size => {
              if (!size.isValidSize) {
                validationReport.invalidSizes.push(`${article.articleNumber}: ${size.sizeName}`);
              }
            });
          });
        });

        return new Response(JSON.stringify({
          success: true,
          parsedData: parsedWIP,
          bundles: generatedBundles,
          validation: validationReport,
          processedAt: new Date().toISOString()
        }), { status: 200, headers });

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: `Parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: 'Please check your sheet format. Expected: LOT info, Article numbers, Department info, Fabric info, Headers, then color/size data.'
        }), { status: 400, headers });
      }
    }

    // Validate sheet structure
    if (req.method === 'POST' && endpoint === 'validate-sheet') {
      const { sheetData } = await req.json();

      if (!Array.isArray(sheetData)) {
        return new Response(JSON.stringify({
          success: false,
          validation: {
            isValid: false,
            errors: ['Sheet data must be an array of rows'],
            warnings: [],
            structure: null
          }
        }), { status: 200, headers });
      }

      const validation = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[],
        structure: {
          totalRows: sheetData.length,
          hasLotInfo: false,
          hasArticleInfo: false,
          hasDepartmentInfo: false,
          hasFabricInfo: false,
          hasHeaders: false,
          colorDataRows: 0,
          detectedArticles: [] as string[],
          detectedSizes: [] as string[]
        }
      };

      try {
        // Check minimum rows
        if (sheetData.length < 6) {
          validation.errors.push('Sheet must have at least 6 rows (LOT, Article, Dept, Fabric, Headers, Color data)');
          validation.isValid = false;
        } else {
          // Validate structure
          const lotRow = sheetData[0];
          const articleRow = sheetData[1];
          const deptRow = sheetData[2];
          const fabricRow = sheetData[3];
          const headerRow = sheetData[4];

          // Check LOT info
          if (lotRow?.[0]?.toString().toLowerCase().includes('lot')) {
            validation.structure.hasLotInfo = true;
          } else {
            validation.errors.push('Row 1 must contain LOT information');
            validation.isValid = false;
          }

          // Check article info
          if (articleRow?.[0]?.toString().toLowerCase().includes('article')) {
            validation.structure.hasArticleInfo = true;
            const articleText = articleRow[0].toString();
            const articles = articleText.replace(/^Article#?\s*/i, '').split(/[+,&]/).map(a => a.trim());
            validation.structure.detectedArticles = articles;

            // Validate articles against database
            articles.forEach(articleNum => {
              const articleInfo = getArticleInfo(articleNum);
              if (!articleInfo) {
                validation.warnings.push(`Article ${articleNum} not found in database. Will use default operations.`);
              }
            });
          } else {
            validation.errors.push('Row 2 must contain Article information');
            validation.isValid = false;
          }

          // Check other info
          if (deptRow && deptRow.length >= 2) validation.structure.hasDepartmentInfo = true;
          if (fabricRow && fabricRow.length >= 2) validation.structure.hasFabricInfo = true;
          if (headerRow && headerRow.length >= 4) validation.structure.hasHeaders = true;

          // Check color data
          const colorRows = sheetData.slice(5);
          validation.structure.colorDataRows = colorRows.length;

          if (colorRows.length === 0) {
            validation.errors.push('No color/size data found. Rows 6+ should contain color and size information.');
            validation.isValid = false;
          } else {
            // Extract detected sizes
            const allSizes = new Set<string>();
            colorRows.forEach(row => {
              if (row && row.length >= 4) {
                for (let i = 4; i < row.length; i += 2) {
                  const sizeName = row[i]?.toString()?.trim();
                  if (sizeName) allSizes.add(sizeName);
                }
              }
            });
            validation.structure.detectedSizes = Array.from(allSizes);
          }
        }

        // Test parsing if structure is valid
        if (validation.isValid) {
          try {
            const testParsed = parseGoogleSheetData(sheetData);
            validation.warnings.push(`Parsing test successful: ${testParsed.articles.length} articles, ${testParsed.totalPieces} total pieces`);
          } catch (parseError) {
            validation.errors.push(`Parsing test failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
            validation.isValid = false;
          }
        }

      } catch (error) {
        validation.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        validation.isValid = false;
      }

      return new Response(JSON.stringify({
        success: true,
        validation
      }), { status: 200, headers });
    }

    // Get available sizes for article
    if (req.method === 'GET' && pathSegments.includes('sizes')) {
      const articleNumber = url.searchParams.get('article');
      
      if (!articleNumber) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Article number parameter is required'
        }), { status: 400, headers });
      }

      const articleInfo = getArticleInfo(articleNumber);
      if (!articleInfo) {
        return new Response(JSON.stringify({
          success: false,
          error: `Article ${articleNumber} not found in database`
        }), { status: 404, headers });
      }

      return new Response(JSON.stringify({
        success: true,
        article: articleNumber,
        availableSizes: articleInfo.availableSizes,
        category: articleInfo.category
      }), { status: 200, headers });
    }

    // Default: unsupported endpoint
    return new Response(JSON.stringify({
      success: false,
      error: 'Endpoint not found',
      availableEndpoints: [
        'GET /articles - Get all articles database',
        'GET /article-{number} - Get specific article info',
        'GET /sizes?article={number} - Get sizes for article',
        'POST /parse-sheet - Parse Google Sheets data',
        'POST /validate-sheet - Validate sheet structure'
      ]
    }), { status: 404, headers });

  } catch (error) {
    console.error('Sheets Integration Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500, headers });
  }
};

export const config: Config = {
  path: ["/api/sheets-integration/*", "/api/sheets-integration"],
};
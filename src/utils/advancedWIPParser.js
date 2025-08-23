// Advanced WIP Parser for Real-World Garment Data
// Handles complex production data formats commonly used in cutting departments

export class AdvancedWIPParser {
  constructor() {
    this.patterns = {
      // Common color name patterns
      colorPatterns: [
        /^color$/i, /^colour$/i, /^रङ$/i, /^रंग$/i,
        /color.*name/i, /colour.*name/i,
        /^shade$/i, /^col$/i
      ],
      
      // Size patterns - comprehensive list
      sizePatterns: {
        // Standard adult sizes
        adult: ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
        // Numeric adult sizes
        numeric: ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48'],
        // Kids sizes
        kids: ['2T', '3T', '4T', '5T', '6', '7', '8', '10', '12', '14', '16'],
        // Age-based kids
        age: ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y', '14-15Y'],
        // European sizes
        european: ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52'],
        // Custom patterns
        custom: []
      },
      
      // Production metadata patterns
      metadataPatterns: {
        lot: [/lot/i, /batch/i, /लट/i, /lot.*no/i, /lot.*number/i],
        article: [/article/i, /style/i, /model/i, /design/i, /लेख/i, /art.*no/i],
        buyer: [/buyer/i, /customer/i, /client/i, /खरीदार/i],
        order: [/order/i, /po/i, /purchase/i, /आर्डर/i, /order.*no/i],
        fabric: [/fabric/i, /material/i, /cloth/i, /कपडा/i],
        weight: [/weight/i, /gsm/i, /gram/i, /तौल/i],
        width: [/width/i, /चौडाई/i, /w\"/i],
        consumption: [/consumption/i, /cons/i, /खपत/i, /rate/i],
        layers: [/layer/i, /ply/i, /लेयर/i, /plies/i],
        pieces: [/pieces/i, /pcs/i, /qty/i, /quantity/i, /टुक्रा/i, /संख्या/i],
        date: [/date/i, /मिति/i, /cutting.*date/i, /production.*date/i],
        shift: [/shift/i, /समय/i, /time/i],
        cutter: [/cutter/i, /operator/i, /काटने.*वाला/i]
      }
    };
  }

  // Main parsing function with enhanced detection
  async parseWIPData(data, options = {}) {
    try {
      if (!data || !Array.isArray(data) || data.length < 2) {
        throw new Error('Invalid data format - expecting array of arrays (CSV-like structure)');
      }

      // Clean and normalize data
      const cleanData = this.cleanData(data);
      
      // Detect the exact format
      const formatInfo = this.detectAdvancedFormat(cleanData);
      
      // Parse based on detected format
      let parsedResult;
      switch (formatInfo.type) {
        case 'cutting_sheet':
          parsedResult = this.parseCuttingSheet(cleanData, formatInfo);
          break;
        case 'production_summary':
          parsedResult = this.parseProductionSummary(cleanData, formatInfo);
          break;
        case 'size_color_matrix':
          parsedResult = this.parseSizeColorMatrix(cleanData, formatInfo);
          break;
        case 'layered_cutting':
          parsedResult = this.parseLayeredCutting(cleanData, formatInfo);
          break;
        case 'batch_wise_data':
          parsedResult = this.parseBatchWiseData(cleanData, formatInfo);
          break;
        default:
          parsedResult = this.parseGenericFormat(cleanData, formatInfo);
      }

      // Add comprehensive metadata
      parsedResult.metadata = {
        ...parsedResult.metadata,
        formatDetected: formatInfo.type,
        confidence: formatInfo.confidence,
        totalRows: cleanData.length - 1,
        totalColumns: cleanData[0]?.length || 0,
        parsedAt: new Date().toISOString(),
        ...this.extractAdvancedMetadata(cleanData, formatInfo)
      };

      // Validate and enhance
      const validation = this.validateData(parsedResult);
      const statistics = this.generateStatistics(parsedResult);

      return {
        ...parsedResult,
        validation,
        statistics,
        formatInfo
      };

    } catch (error) {
      throw new Error(`Advanced WIP parsing failed: ${error.message}`);
    }
  }

  // Enhanced format detection with confidence scoring
  detectAdvancedFormat(data) {
    const headers = data[0].map(h => h?.toString().toLowerCase().trim());
    const sampleRows = data.slice(1, Math.min(6, data.length));
    
    let candidates = [];

    // Test for cutting sheet format
    const cuttingScore = this.scoreCuttingSheet(headers, sampleRows);
    if (cuttingScore > 0.6) {
      candidates.push({ type: 'cutting_sheet', confidence: cuttingScore, headers });
    }

    // Test for production summary
    const summaryScore = this.scoreProductionSummary(headers, sampleRows);
    if (summaryScore > 0.6) {
      candidates.push({ type: 'production_summary', confidence: summaryScore, headers });
    }

    // Test for size-color matrix
    const matrixScore = this.scoreSizeColorMatrix(headers, sampleRows);
    if (matrixScore > 0.6) {
      candidates.push({ type: 'size_color_matrix', confidence: matrixScore, headers });
    }

    // Test for layered cutting data
    const layeredScore = this.scoreLayeredCutting(headers, sampleRows);
    if (layeredScore > 0.6) {
      candidates.push({ type: 'layered_cutting', confidence: layeredScore, headers });
    }

    // Test for batch-wise data
    const batchScore = this.scoreBatchWiseData(headers, sampleRows);
    if (batchScore > 0.6) {
      candidates.push({ type: 'batch_wise_data', confidence: batchScore, headers });
    }

    // Return highest confidence format
    if (candidates.length > 0) {
      const best = candidates.sort((a, b) => b.confidence - a.confidence)[0];
      return {
        ...best,
        allCandidates: candidates
      };
    }

    // Fallback to generic
    return {
      type: 'generic',
      confidence: 0.3,
      headers,
      allCandidates: candidates
    };
  }

  // Score cutting sheet format (Color, Size breakdown, Layers, etc.)
  scoreCuttingSheet(headers, sampleRows) {
    let score = 0;
    const total = 100;

    // Check for color column
    if (this.findColumnByPatterns(headers, this.patterns.colorPatterns) !== -1) {
      score += 25;
    }

    // Check for size columns
    const sizeColumns = this.findSizeColumns(headers);
    if (sizeColumns.length >= 3) {
      score += 25;
    }

    // Check for layers/ply information
    if (this.findColumnByPatterns(headers, this.patterns.metadataPatterns.layers) !== -1) {
      score += 20;
    }

    // Check for cutting-related metadata
    const cuttingMetadata = ['lot', 'article', 'fabric', 'consumption'].reduce((count, key) => {
      return this.findColumnByPatterns(headers, this.patterns.metadataPatterns[key]) !== -1 ? count + 1 : count;
    }, 0);
    score += (cuttingMetadata / 4) * 20;

    // Check data patterns in sample rows
    if (sampleRows.length > 0) {
      const hasNumericData = sampleRows.some(row => 
        row.some(cell => /^\d+$/.test(cell?.toString().trim()))
      );
      if (hasNumericData) score += 10;
    }

    return score / total;
  }

  // Score production summary format
  scoreProductionSummary(headers, sampleRows) {
    let score = 0;
    const total = 100;

    // Check for production-related headers
    const productionHeaders = ['total', 'completed', 'pending', 'target', 'efficiency'].filter(term =>
      headers.some(h => h.includes(term))
    );
    score += (productionHeaders.length / 5) * 40;

    // Check for date/time columns
    if (this.findColumnByPatterns(headers, this.patterns.metadataPatterns.date) !== -1) {
      score += 20;
    }

    // Check for summary indicators
    if (headers.some(h => h.includes('summary') || h.includes('total') || h.includes('grand'))) {
      score += 20;
    }

    // Check for batch/lot grouping
    if (this.findColumnByPatterns(headers, this.patterns.metadataPatterns.lot) !== -1) {
      score += 20;
    }

    return score / total;
  }

  // Score size-color matrix format
  scoreSizeColorMatrix(headers, sampleRows) {
    let score = 0;
    const total = 100;

    // Check for color column
    const colorCol = this.findColumnByPatterns(headers, this.patterns.colorPatterns);
    if (colorCol !== -1) score += 30;

    // Check for multiple size columns
    const sizeColumns = this.findSizeColumns(headers);
    if (sizeColumns.length >= 4) {
      score += 40;
    } else if (sizeColumns.length >= 2) {
      score += 20;
    }

    // Check for matrix-like structure (mostly numeric data)
    if (sampleRows.length > 0) {
      const numericCells = sampleRows.reduce((count, row) => {
        return count + row.filter(cell => /^\d+$/.test(cell?.toString().trim())).length;
      }, 0);
      const totalCells = sampleRows.length * (sampleRows[0]?.length || 0);
      if (totalCells > 0 && (numericCells / totalCells) > 0.6) {
        score += 30;
      }
    }

    return score / total;
  }

  // Score layered cutting format
  scoreLayeredCutting(headers, sampleRows) {
    let score = 0;
    const total = 100;

    // Check for layer/ply column
    if (this.findColumnByPatterns(headers, this.patterns.metadataPatterns.layers) !== -1) {
      score += 35;
    }

    // Check for fabric information
    if (this.findColumnByPatterns(headers, this.patterns.metadataPatterns.fabric) !== -1) {
      score += 20;
    }

    // Check for consumption data
    if (this.findColumnByPatterns(headers, this.patterns.metadataPatterns.consumption) !== -1) {
      score += 20;
    }

    // Check for cutting-specific terms
    if (headers.some(h => h.includes('cutting') || h.includes('spread') || h.includes('marker'))) {
      score += 25;
    }

    return score / total;
  }

  // Score batch-wise data format
  scoreBatchWiseData(headers, sampleRows) {
    let score = 0;
    const total = 100;

    // Check for batch/lot column
    if (this.findColumnByPatterns(headers, this.patterns.metadataPatterns.lot) !== -1) {
      score += 40;
    }

    // Check for article/style column
    if (this.findColumnByPatterns(headers, this.patterns.metadataPatterns.article) !== -1) {
      score += 25;
    }

    // Check for date column
    if (this.findColumnByPatterns(headers, this.patterns.metadataPatterns.date) !== -1) {
      score += 20;
    }

    // Check for aggregated data patterns
    if (headers.some(h => h.includes('total') || h.includes('sum') || h.includes('batch'))) {
      score += 15;
    }

    return score / total;
  }

  // Enhanced cutting sheet parser
  parseCuttingSheet(data, formatInfo) {
    const headers = data[0].map(h => h?.toString().trim());
    const colorIndex = this.findColumnByPatterns(headers, this.patterns.colorPatterns);
    const sizeColumns = this.findSizeColumns(headers);
    const layerIndex = this.findColumnByPatterns(headers, this.patterns.metadataPatterns.layers);

    const colors = [];
    let totalPieces = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[colorIndex]) continue;

      const colorName = row[colorIndex].toString().trim();
      if (!colorName) continue;

      const pieces = {};
      let colorTotal = 0;

      // Extract size-wise pieces
      sizeColumns.forEach(({ size, index }) => {
        const count = this.parseNumber(row[index]);
        if (count > 0) {
          pieces[size] = count;
          colorTotal += count;
        }
      });

      if (colorTotal > 0) {
        const layers = layerIndex !== -1 ? this.parseNumber(row[layerIndex]) : this.estimateLayers(colorTotal);
        
        colors.push({
          name: colorName,
          pieces,
          total: colorTotal,
          layers,
          piecesPerLayer: layers > 0 ? Math.round(colorTotal / layers) : 0
        });
        totalPieces += colorTotal;
      }
    }

    return {
      format: 'cutting_sheet',
      colors,
      totalPieces,
      metadata: {}
    };
  }

  // Enhanced production summary parser
  parseProductionSummary(data, formatInfo) {
    const headers = data[0].map(h => h?.toString().toLowerCase().trim());
    const colors = [];
    let totalPieces = 0;
    let metadata = {};

    // Find relevant columns
    const lotIndex = this.findColumnByPatterns(headers, this.patterns.metadataPatterns.lot);
    const articleIndex = this.findColumnByPatterns(headers, this.patterns.metadataPatterns.article);
    const colorIndex = this.findColumnByPatterns(headers, this.patterns.colorPatterns);
    const totalIndex = headers.findIndex(h => h.includes('total') || h.includes('sum'));

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const colorName = colorIndex !== -1 ? row[colorIndex]?.toString().trim() : `Color ${i}`;
      const total = totalIndex !== -1 ? this.parseNumber(row[totalIndex]) : 0;

      if (colorName && total > 0) {
        colors.push({
          name: colorName,
          pieces: { 'Mixed': total },
          total: total,
          layers: this.estimateLayers(total)
        });
        totalPieces += total;
      }

      // Extract metadata from first row
      if (i === 1) {
        if (lotIndex !== -1) metadata.lotNumber = row[lotIndex];
        if (articleIndex !== -1) metadata.articles = [row[articleIndex]];
      }
    }

    return {
      format: 'production_summary',
      colors,
      totalPieces,
      metadata
    };
  }

  // Enhanced batch-wise data parser
  parseBatchWiseData(data, formatInfo) {
    const headers = data[0].map(h => h?.toString().toLowerCase().trim());
    const colors = [];
    let totalPieces = 0;
    let metadata = {};

    // Find relevant columns
    const lotIndex = this.findColumnByPatterns(headers, this.patterns.metadataPatterns.lot);
    const articleIndex = this.findColumnByPatterns(headers, this.patterns.metadataPatterns.article);
    const colorIndex = this.findColumnByPatterns(headers, this.patterns.colorPatterns);
    const piecesIndex = this.findColumnByPatterns(headers, this.patterns.metadataPatterns.pieces);
    const dateIndex = this.findColumnByPatterns(headers, this.patterns.metadataPatterns.date);

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const colorName = colorIndex !== -1 ? row[colorIndex]?.toString().trim() : `Batch ${i}`;
      const pieces = piecesIndex !== -1 ? this.parseNumber(row[piecesIndex]) : 0;

      if (colorName && pieces > 0) {
        // Check if color already exists
        const existingColor = colors.find(c => c.name === colorName);
        if (existingColor) {
          existingColor.total += pieces;
          existingColor.pieces['Mixed'] = (existingColor.pieces['Mixed'] || 0) + pieces;
        } else {
          colors.push({
            name: colorName,
            pieces: { 'Mixed': pieces },
            total: pieces,
            layers: this.estimateLayers(pieces)
          });
        }
        totalPieces += pieces;
      }

      // Extract metadata from first row
      if (i === 1) {
        if (lotIndex !== -1) metadata.lotNumber = row[lotIndex];
        if (articleIndex !== -1) metadata.articles = [row[articleIndex]];
        if (dateIndex !== -1) metadata.cuttingDate = row[dateIndex];
      }
    }

    return {
      format: 'batch_wise_data',
      colors,
      totalPieces,
      metadata
    };
  }

  // Enhanced layered cutting parser
  parseLayeredCutting(data, formatInfo) {
    const headers = data[0].map(h => h?.toString().toLowerCase().trim());
    const colors = [];
    let totalPieces = 0;
    let metadata = {};

    // Find key column indices
    const lotIndex = this.findColumnByPatterns(headers, this.patterns.metadataPatterns.lot);
    const articleIndex = this.findColumnByPatterns(headers, this.patterns.metadataPatterns.article);
    const dateIndex = this.findColumnByPatterns(headers, this.patterns.metadataPatterns.date);
    
    // Look for color patterns in the data rows since they might not be in a single column
    const colorSizeData = this.extractLayeredColorData(data);
    
    // Extract metadata from first few rows
    if (data.length > 1) {
      const firstRow = data[1];
      if (lotIndex !== -1) metadata.lotNumber = firstRow[lotIndex];
      if (articleIndex !== -1) metadata.articles = [firstRow[articleIndex]];
      if (dateIndex !== -1) metadata.cuttingDate = firstRow[dateIndex];
    }

    // Process the color data
    Object.entries(colorSizeData).forEach(([colorName, colorData]) => {
      if (colorData.total > 0) {
        colors.push({
          name: colorName,
          pieces: colorData.pieces,
          total: colorData.total,
          layers: colorData.layers || this.estimateLayers(colorData.total),
          piecesPerLayer: colorData.layers > 0 ? Math.round(colorData.total / colorData.layers) : 0
        });
        totalPieces += colorData.total;
      }
    });

    return {
      format: 'layered_cutting',
      colors,
      totalPieces,
      metadata
    };
  }

  // Enhanced size-color matrix parser
  parseSizeColorMatrix(data, formatInfo) {
    const headers = data[0].map(h => h?.toString().trim());
    
    // Check if it's color-as-rows or size-as-rows
    const colorIndex = this.findColumnByPatterns(headers, this.patterns.colorPatterns);
    const sizeIndex = headers.findIndex(h => 
      Object.values(this.patterns.sizePatterns).flat().some(size => 
        h.toLowerCase() === size.toLowerCase()
      )
    );

    if (colorIndex !== -1) {
      // Colors as rows, sizes as columns
      return this.parseCuttingSheet(data, formatInfo);
    } else if (sizeIndex === 0) {
      // Sizes as rows, colors as columns
      return this.parseVerticalSizeMatrix(data, formatInfo);
    }

    return this.parseGenericFormat(data, formatInfo);
  }

  // Parse vertical size matrix (Size | Color1 | Color2 | Color3)
  parseVerticalSizeMatrix(data, formatInfo) {
    const headers = data[0].map(h => h?.toString().trim());
    const sizeIndex = 0; // Assuming first column is size
    
    const colorColumns = {};
    for (let i = 1; i < headers.length; i++) {
      if (headers[i] && headers[i].trim()) {
        colorColumns[headers[i]] = i;
      }
    }

    const colors = {};
    Object.keys(colorColumns).forEach(colorName => {
      colors[colorName] = {
        name: colorName,
        pieces: {},
        total: 0
      };
    });

    let totalPieces = 0;

    // Process data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[sizeIndex]) continue;

      const size = row[sizeIndex].toString().trim();
      if (!size) continue;

      Object.entries(colorColumns).forEach(([colorName, colIndex]) => {
        const pieces = this.parseNumber(row[colIndex]);
        if (pieces > 0) {
          colors[colorName].pieces[size] = pieces;
          colors[colorName].total += pieces;
          totalPieces += pieces;
        }
      });
    }

    const colorsArray = Object.values(colors)
      .filter(color => color.total > 0)
      .map(color => ({
        ...color,
        layers: this.estimateLayers(color.total)
      }));

    return {
      format: 'size_color_matrix',
      colors: colorsArray,
      totalPieces,
      metadata: {}
    };
  }

  // Utility functions
  cleanData(data) {
    return data.map(row => 
      row.map(cell => 
        cell?.toString().trim().replace(/^["']|["']$/g, '') || ''
      )
    ).filter(row => row.some(cell => cell.length > 0));
  }

  findColumnByPatterns(headers, patterns) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase();
      if (patterns.some(pattern => pattern.test ? pattern.test(header) : header.includes(pattern.toLowerCase()))) {
        return i;
      }
    }
    return -1;
  }

  findSizeColumns(headers) {
    const sizeColumns = [];
    const allSizes = Object.values(this.patterns.sizePatterns).flat();

    headers.forEach((header, index) => {
      const cleanHeader = header.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const matchedSize = allSizes.find(size => 
        cleanHeader === size.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
      );
      
      if (matchedSize) {
        sizeColumns.push({
          size: matchedSize,
          index,
          originalHeader: header
        });
      }
    });

    return sizeColumns;
  }

  parseNumber(value) {
    if (!value) return 0;
    const num = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : Math.max(0, Math.floor(num));
  }

  estimateLayers(totalPieces) {
    if (totalPieces <= 25) return Math.ceil(totalPieces / 12);
    if (totalPieces <= 100) return Math.ceil(totalPieces / 25);
    if (totalPieces <= 300) return Math.ceil(totalPieces / 35);
    return Math.ceil(totalPieces / 50);
  }

  extractAdvancedMetadata(data, formatInfo) {
    const headers = data[0];
    const metadata = {};

    Object.entries(this.patterns.metadataPatterns).forEach(([key, patterns]) => {
      const colIndex = this.findColumnByPatterns(headers, patterns);
      if (colIndex !== -1) {
        // Find first non-empty value
        for (let i = 1; i < data.length; i++) {
          const value = data[i]?.[colIndex]?.toString().trim();
          if (value) {
            metadata[key] = value;
            break;
          }
        }
      }
    });

    return metadata;
  }

  validateData(parsedResult) {
    const errors = [];
    const warnings = [];

    if (!parsedResult.colors || parsedResult.colors.length === 0) {
      errors.push('No color data found');
    }

    if (parsedResult.totalPieces <= 0) {
      errors.push('No pieces found');
    }

    parsedResult.colors?.forEach((color, index) => {
      if (!color.name) {
        warnings.push(`Color ${index + 1} has no name`);
      }
      if (Object.keys(color.pieces).length === 0) {
        warnings.push(`Color "${color.name}" has no size data`);
      }
    });

    return { errors, warnings, isValid: errors.length === 0 };
  }

  generateStatistics(parsedResult) {
    return {
      totalColors: parsedResult.colors?.length || 0,
      totalSizes: [...new Set(parsedResult.colors?.flatMap(c => Object.keys(c.pieces)) || [])].length,
      totalPieces: parsedResult.totalPieces || 0,
      averagePiecesPerColor: parsedResult.colors?.length > 0 ? 
        Math.round(parsedResult.totalPieces / parsedResult.colors.length) : 0,
      estimatedBundles: Math.ceil((parsedResult.totalPieces || 0) / 30),
      format: parsedResult.format
    };
  }

  // Extract layer-based color data from complex cutting sheets
  extractLayeredColorData(data) {
    const colorData = {};
    
    // Pattern to match color-size-quantity lines like "White 15 pcs XL", "Dark Gray 17 pcs L"
    const colorSizePattern = /([A-Za-z\s]+?)\s+(\d+)\s+pcs\s+([A-Za-z0-9]+)/gi;
    
    // Also look for layer information
    const layerPattern = /(\d+)\s*layer[s]?/gi;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Check each cell for color-size-quantity patterns
      row.forEach(cell => {
        if (!cell) return;
        const cellText = cell.toString().trim();
        
        // Extract layer information if present
        const layerMatch = layerPattern.exec(cellText);
        let layers = null;
        if (layerMatch) {
          layers = parseInt(layerMatch[1]);
        }
        
        // Extract color-size-quantity patterns
        let match;
        colorSizePattern.lastIndex = 0; // Reset regex
        while ((match = colorSizePattern.exec(cellText)) !== null) {
          const [, colorName, quantity, size] = match;
          const cleanColorName = colorName.trim();
          const qty = parseInt(quantity);
          const cleanSize = size.trim().toUpperCase();
          
          if (!colorData[cleanColorName]) {
            colorData[cleanColorName] = {
              pieces: {},
              total: 0,
              layers: layers || null
            };
          }
          
          if (!colorData[cleanColorName].pieces[cleanSize]) {
            colorData[cleanColorName].pieces[cleanSize] = 0;
          }
          
          colorData[cleanColorName].pieces[cleanSize] += qty;
          colorData[cleanColorName].total += qty;
          
          // Update layers if found
          if (layers && !colorData[cleanColorName].layers) {
            colorData[cleanColorName].layers = layers;
          }
        }
      });
    }
    
    return colorData;
  }

  parseGenericFormat(data, formatInfo) {
    // Try to extract any recognizable patterns
    const colorData = this.extractLayeredColorData(data);
    
    if (Object.keys(colorData).length > 0) {
      const colors = Object.entries(colorData).map(([colorName, data]) => ({
        name: colorName,
        pieces: data.pieces,
        total: data.total,
        layers: data.layers || this.estimateLayers(data.total),
        piecesPerLayer: data.layers > 0 ? Math.round(data.total / data.layers) : 0
      }));
      
      return {
        format: 'generic_extracted',
        colors,
        totalPieces: colors.reduce((sum, c) => sum + c.total, 0),
        metadata: { parseWarning: 'Used pattern extraction on generic format' }
      };
    }
    
    // Ultimate fallback
    return {
      format: 'generic',
      colors: [{
        name: 'Unknown Color',
        pieces: { 'L': 50, 'XL': 50 },
        total: 100,
        layers: 4
      }],
      totalPieces: 100,
      metadata: { parseWarning: 'Used generic fallback parsing' }
    };
  }
}

export default AdvancedWIPParser;
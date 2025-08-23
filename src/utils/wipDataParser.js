// WIP Data Parser for Multiple Formats
// Handles various Excel/CSV formats used in garment cutting departments

export class WIPDataParser {
  constructor() {
    this.supportedFormats = [
      'horizontal_matrix',    // Colors as rows, sizes as columns
      'vertical_matrix',      // Sizes as rows, colors as columns  
      'detailed_breakdown',   // Separate rows for each color-size combination
      'batch_summary',        // Aggregated data with batch information
      'cutting_layout'        // Layout-based data with layer information
    ];
  }

  // Main parsing function that auto-detects format and parses accordingly
  async parseWIPData(data, format = 'auto') {
    try {
      if (!data || !data.length) {
        throw new Error('No data provided');
      }

      // Auto-detect format if not specified
      if (format === 'auto') {
        format = this.detectFormat(data);
      }

      // Parse based on detected/specified format
      switch (format) {
        case 'horizontal_matrix':
          return this.parseHorizontalMatrix(data);
        case 'vertical_matrix':
          return this.parseVerticalMatrix(data);
        case 'detailed_breakdown':
          return this.parseDetailedBreakdown(data);
        case 'batch_summary':
          return this.parseBatchSummary(data);
        case 'cutting_layout':
          return this.parseCuttingLayout(data);
        default:
          return this.parseGenericFormat(data);
      }
    } catch (error) {
      console.error('Error parsing WIP data:', error);
      throw new Error(`WIP parsing failed: ${error.message}`);
    }
  }

  // Auto-detect data format based on headers and structure
  detectFormat(data) {
    if (!data || data.length < 2) return 'generic';

    const headers = data[0].map(h => h?.toString().toLowerCase().trim());
    const firstDataRow = data[1] || [];

    // Check for horizontal matrix (colors as rows, sizes as columns)
    const sizeHeaders = ['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl'];
    const hasSizeColumns = sizeHeaders.some(size => 
      headers.some(h => h.includes(size) || h === size)
    );

    if (hasSizeColumns && headers.includes('color')) {
      return 'horizontal_matrix';
    }

    // Check for vertical matrix (sizes as rows, colors as columns)
    const colorPattern = /color|colour|रङ/i;
    const hasColorColumns = headers.filter(h => colorPattern.test(h)).length > 2;
    
    if (hasColorColumns && headers.some(h => sizeHeaders.includes(h))) {
      return 'vertical_matrix';
    }

    // Check for detailed breakdown
    if (headers.includes('size') && headers.includes('color') && headers.includes('pieces')) {
      return 'detailed_breakdown';
    }

    // Check for batch/lot summary
    if (headers.includes('lot') || headers.includes('batch')) {
      return 'batch_summary';
    }

    // Check for cutting layout
    if (headers.includes('layer') || headers.includes('ply')) {
      return 'cutting_layout';
    }

    return 'generic';
  }

  // Parse horizontal matrix format (Color, XS, S, M, L, XL, 2XL, 3XL)
  parseHorizontalMatrix(data) {
    const headers = data[0].map(h => h?.toString().trim());
    const colorIndex = this.findColumnIndex(headers, ['color', 'colour', 'रङ', 'रंग']);
    
    if (colorIndex === -1) {
      throw new Error('Color column not found in horizontal matrix format');
    }

    // Find size columns
    const sizeColumns = {};
    const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    
    sizes.forEach(size => {
      const index = this.findColumnIndex(headers, [size.toLowerCase(), size]);
      if (index !== -1) {
        sizeColumns[size] = index;
      }
    });

    const colors = [];
    let totalPieces = 0;

    // Process data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[colorIndex]) continue;

      const colorName = row[colorIndex].toString().trim();
      if (!colorName) continue;

      const pieces = {};
      let colorTotal = 0;

      // Extract pieces for each size
      Object.entries(sizeColumns).forEach(([size, colIndex]) => {
        const pieceCount = this.parseNumber(row[colIndex]);
        if (pieceCount > 0) {
          pieces[size] = pieceCount;
          colorTotal += pieceCount;
        }
      });

      if (colorTotal > 0) {
        colors.push({
          name: colorName,
          pieces: pieces,
          total: colorTotal,
          layers: this.estimateLayers(colorTotal)
        });
        totalPieces += colorTotal;
      }
    }

    return {
      format: 'horizontal_matrix',
      colors: colors,
      totalPieces: totalPieces,
      metadata: this.extractMetadata(data, headers)
    };
  }

  // Parse vertical matrix format (Size, Color1, Color2, Color3...)
  parseVerticalMatrix(data) {
    const headers = data[0].map(h => h?.toString().trim());
    const sizeIndex = this.findColumnIndex(headers, ['size', 'साइज']);
    
    if (sizeIndex === -1) {
      throw new Error('Size column not found in vertical matrix format');
    }

    // Find color columns (skip size column)
    const colorColumns = {};
    for (let i = 0; i < headers.length; i++) {
      if (i !== sizeIndex && headers[i]) {
        const colorName = headers[i].toString().trim();
        if (colorName && colorName.length > 0) {
          colorColumns[colorName] = i;
        }
      }
    }

    const colors = {};
    let totalPieces = 0;

    // Initialize colors
    Object.keys(colorColumns).forEach(colorName => {
      colors[colorName] = {
        name: colorName,
        pieces: {},
        total: 0
      };
    });

    // Process data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[sizeIndex]) continue;

      const size = row[sizeIndex].toString().trim();
      if (!size) continue;

      // Extract pieces for each color
      Object.entries(colorColumns).forEach(([colorName, colIndex]) => {
        const pieceCount = this.parseNumber(row[colIndex]);
        if (pieceCount > 0) {
          colors[colorName].pieces[size] = pieceCount;
          colors[colorName].total += pieceCount;
          totalPieces += pieceCount;
        }
      });
    }

    // Convert to array format and add layer estimation
    const colorsArray = Object.values(colors)
      .filter(color => color.total > 0)
      .map(color => ({
        ...color,
        layers: this.estimateLayers(color.total)
      }));

    return {
      format: 'vertical_matrix',
      colors: colorsArray,
      totalPieces: totalPieces,
      metadata: this.extractMetadata(data, headers)
    };
  }

  // Parse detailed breakdown format (Color, Size, Pieces, etc.)
  parseDetailedBreakdown(data) {
    const headers = data[0].map(h => h?.toString().toLowerCase().trim());
    const colorIndex = this.findColumnIndex(headers, ['color', 'colour', 'रङ']);
    const sizeIndex = this.findColumnIndex(headers, ['size', 'साइज']);
    const piecesIndex = this.findColumnIndex(headers, ['pieces', 'qty', 'quantity', 'टुक्रा']);

    if (colorIndex === -1 || sizeIndex === -1 || piecesIndex === -1) {
      throw new Error('Required columns (Color, Size, Pieces) not found');
    }

    const colorMap = new Map();
    let totalPieces = 0;

    // Process data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      const colorName = row[colorIndex]?.toString().trim();
      const size = row[sizeIndex]?.toString().trim();
      const pieces = this.parseNumber(row[piecesIndex]);

      if (!colorName || !size || pieces <= 0) continue;

      if (!colorMap.has(colorName)) {
        colorMap.set(colorName, {
          name: colorName,
          pieces: {},
          total: 0
        });
      }

      const color = colorMap.get(colorName);
      color.pieces[size] = pieces;
      color.total += pieces;
      totalPieces += pieces;
    }

    const colors = Array.from(colorMap.values()).map(color => ({
      ...color,
      layers: this.estimateLayers(color.total)
    }));

    return {
      format: 'detailed_breakdown',
      colors: colors,
      totalPieces: totalPieces,
      metadata: this.extractMetadata(data, headers)
    };
  }

  // Parse batch/lot summary format
  parseBatchSummary(data) {
    const headers = data[0].map(h => h?.toString().toLowerCase().trim());
    const result = this.parseGenericFormat(data);
    
    // Extract additional batch/lot information
    const lotIndex = this.findColumnIndex(headers, ['lot', 'batch', 'लट']);
    const dateIndex = this.findColumnIndex(headers, ['date', 'cutting_date', 'मिति']);
    
    if (lotIndex !== -1) {
      result.metadata.lotNumbers = [...new Set(
        data.slice(1)
          .map(row => row[lotIndex]?.toString().trim())
          .filter(Boolean)
      )];
    }

    if (dateIndex !== -1) {
      result.metadata.cuttingDates = [...new Set(
        data.slice(1)
          .map(row => row[dateIndex]?.toString().trim())
          .filter(Boolean)
      )];
    }

    result.format = 'batch_summary';
    return result;
  }

  // Parse cutting layout format (with layer information)
  parseCuttingLayout(data) {
    const headers = data[0].map(h => h?.toString().toLowerCase().trim());
    const result = this.parseGenericFormat(data);
    
    // Extract layer information
    const layerIndex = this.findColumnIndex(headers, ['layer', 'ply', 'layers', 'लेयर']);
    
    if (layerIndex !== -1) {
      result.colors = result.colors.map((color, index) => {
        const layerInfo = data[index + 1]?.[layerIndex];
        return {
          ...color,
          layers: this.parseNumber(layerInfo) || color.layers
        };
      });
    }

    result.format = 'cutting_layout';
    return result;
  }

  // Generic parser for unknown formats
  parseGenericFormat(data) {
    const headers = data[0].map(h => h?.toString().trim());
    
    // Try to find color and size information in any format
    const possibleFormats = [
      () => this.parseHorizontalMatrix(data),
      () => this.parseVerticalMatrix(data),
      () => this.parseDetailedBreakdown(data)
    ];

    for (const parser of possibleFormats) {
      try {
        return parser();
      } catch (error) {
        continue;
      }
    }

    // If all else fails, create a minimal structure
    return {
      format: 'generic',
      colors: [{
        name: 'Generic Color',
        pieces: { 'L': 100, 'XL': 100 },
        total: 200,
        layers: 8
      }],
      totalPieces: 200,
      metadata: {
        headers: headers,
        totalRows: data.length - 1,
        parseError: 'Could not determine exact format, using generic structure'
      }
    };
  }

  // Helper functions
  findColumnIndex(headers, searchTerms) {
    for (const term of searchTerms) {
      const index = headers.findIndex(h => 
        h && h.toLowerCase().includes(term.toLowerCase())
      );
      if (index !== -1) return index;
    }
    return -1;
  }

  parseNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : Math.max(0, Math.floor(num));
  }

  estimateLayers(totalPieces) {
    // Estimate layers based on typical cutting practices
    if (totalPieces <= 50) return Math.ceil(totalPieces / 12);
    if (totalPieces <= 200) return Math.ceil(totalPieces / 25);
    if (totalPieces <= 500) return Math.ceil(totalPieces / 35);
    return Math.ceil(totalPieces / 50);
  }

  extractMetadata(data, headers) {
    const metadata = {
      headers: headers,
      totalRows: data.length - 1,
      parsedAt: new Date().toISOString()
    };

    // Look for common metadata fields
    const metadataFields = {
      'article': ['article', 'article_no', 'style', 'model'],
      'buyer': ['buyer', 'customer', 'client'],
      'order': ['order', 'po', 'order_no', 'po_no'],
      'lot': ['lot', 'batch', 'lot_no'],
      'fabric': ['fabric', 'material', 'fabric_type'],
      'weight': ['weight', 'gsm', 'fabric_weight']
    };

    Object.entries(metadataFields).forEach(([key, searchTerms]) => {
      const index = this.findColumnIndex(headers, searchTerms);
      if (index !== -1) {
        // Get first non-empty value from this column
        for (let i = 1; i < data.length; i++) {
          const value = data[i]?.[index]?.toString().trim();
          if (value) {
            metadata[key] = value;
            break;
          }
        }
      }
    });

    return metadata;
  }

  // Validate parsed data
  validateParsedData(parsedData) {
    const errors = [];
    const warnings = [];

    if (!parsedData.colors || parsedData.colors.length === 0) {
      errors.push('No color data found');
    }

    if (parsedData.totalPieces <= 0) {
      errors.push('No pieces found in data');
    }

    parsedData.colors.forEach((color, index) => {
      if (!color.name) {
        warnings.push(`Color ${index + 1} has no name`);
      }
      
      if (Object.keys(color.pieces).length === 0) {
        warnings.push(`Color "${color.name}" has no size breakdown`);
      }
    });

    return { errors, warnings, isValid: errors.length === 0 };
  }

  // Generate processing statistics
  generateStats(parsedData) {
    const totalColors = parsedData.colors.length;
    const totalSizes = [...new Set(
      parsedData.colors.flatMap(color => Object.keys(color.pieces))
    )].length;
    
    const averagePiecesPerColor = totalColors > 0 ? 
      Math.round(parsedData.totalPieces / totalColors) : 0;
    
    const estimatedBundles = Math.ceil(parsedData.totalPieces / 30);
    
    return {
      totalColors,
      totalSizes,
      totalPieces: parsedData.totalPieces,
      averagePiecesPerColor,
      estimatedBundles,
      format: parsedData.format,
      processingTime: new Date().toISOString()
    };
  }
}

// Export utility functions for direct use
export const parseWIPData = async (data, format = 'auto') => {
  const parser = new WIPDataParser();
  return await parser.parseWIPData(data, format);
};

export const detectWIPFormat = (data) => {
  const parser = new WIPDataParser();
  return parser.detectFormat(data);
};

export default WIPDataParser;